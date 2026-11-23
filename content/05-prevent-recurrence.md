---
id: chapter-05
num: "05"
title: 훅으로 검증을 작업 흐름에 묶습니다
---

4장의 평가로 스킬은 나아졌지만, 결과 표가 보여 준 것은 비율입니다. v3에서도 t3는 다섯 번 중 한 번 실패했습니다. 스킬은 에이전트가 읽고 해석해서 따르는 절차이므로, 4장에서 한 줄이 잘못 읽혀 작업이 멈췄던 것처럼 언제든 다르게 따라질 수 있습니다. 서론의 Codex처럼 검증 없이 완료를 보고하는 일도 스킬만으로는 완전히 막을 수 없습니다.

매번 반드시 지켜야 하는 검사를 이 비율에 맡기지 않고, 작업하는 동안 그 자리에서 실행되게 하는 방법이 훅입니다. Codex의 훅<span class="badge codex">Codex 전용</span>은 작업 중 정해진 시점에 스크립트를 실행하는 확장 지점입니다. [@05] 스킬이 선택되었는지, 어떻게 읽혔는지와 상관없이, 파일을 고치기 직전이나 작업을 마치기 직전에 검사를 끼워 넣을 수 있습니다.

<div aria-label="작업 시작부터 작업 종료까지의 시간 순서에서 스킬과 훅이 각각 작동하는 시점" class="diagram" role="img">
<div class="diagram-steps">
<div><span class="diagram-kicker">작업 시작</span><strong>스킬</strong><small>선택되면 절차를 제공</small></div>
<span class="diagram-arrow">→</span>
<div><span class="diagram-kicker">파일 수정 직전</span><strong>훅</strong><small>PreToolUse: 금지된 수정 차단</small></div>
<span class="diagram-arrow">→</span>
<div><span class="diagram-kicker">작업 종료 직전</span><strong>훅</strong><small>Stop: 계약 테스트</small></div>
</div>
</div>

### 훅의 구조

훅은 이벤트, 그 이벤트 가운데 어떤 경우에 실행할지 정하는 매처, 실행할 핸들러로 이루어집니다. 프로젝트의 훅은 `.codex/hooks.json`에 두며, 신뢰한 프로젝트의 훅만 실행됩니다. [@05] 이 장에서 쓰는 이벤트는 두 가지입니다.

| 이벤트 | 실행 시점 | 할 수 있는 일 |
|---|---|---|
| `PreToolUse` | Bash 명령, `apply_patch`를 통한 파일 수정, MCP 도구 호출을 실행하기 전 | `permissionDecision: "deny"`로 그 호출을 막고 이유를 돌려준다 |
| `Stop` | 턴을 마치기 전 | `decision: "block"`으로 턴을 끝내지 않고, `reason`을 새 프롬프트로 삼아 작업을 이어 가게 한다 |

훅은 표준 입력으로 JSON 하나를 받습니다. `PreToolUse`라면 `tool_name`과 `tool_input`이 들어 있고, 파일 수정이면 `tool_name`이 `apply_patch`, 패치 본문은 `tool_input.command`입니다. `Stop`에는 이 턴이 이미 `Stop` 훅 때문에 이어진 적이 있는지 알려 주는 `stop_hook_active`가 들어 있습니다. [@05]

### 예시 1: 레거시 엔드포인트의 수정을 막습니다

<p class="keep-with-next">서론의 Codex는 <code>GET /api/v2/users/:id</code>의 핸들러를 고쳤습니다. 레거시 엔드포인트의 파일을 고치려는 순간 막고, 어디를 고쳐야 하는지 알려 주는 훅입니다.</p>

```bash .codex/hooks/guard-legacy.sh
#!/usr/bin/env bash
# PreToolUse(apply_patch): 레거시 사용자 조회 엔드포인트의 파일 수정을 막는다.
set -euo pipefail
patch=$(jq -r '.tool_input.command // ""')

if grep -Eq 'src/(api/v2/users|profile)/' <<<"$patch"; then
  jq -n '{hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: "레거시 사용자 조회 엔드포인트입니다. 정식 엔드포인트는 GET /users/:id(src/legacy/users.controller.ts)입니다. AGENTS.md를 확인하세요."
  }}'
fi
```

이 훅은 스킬이 선택되지 않은 작업에서도 작동합니다. 막힌 Codex는 이유에 적힌 정식 엔드포인트로 대상을 바꿉니다. 스킬의 1·2단계가 판단으로 찾아내야 했던 것을, 훅은 금지로 강제합니다. 다만 어느 엔드포인트가 정식인지는 여전히 `AGENTS.md`에 적힌 사실이고, 훅은 그 사실을 어기는 수정을 막을 뿐입니다.

### 예시 2: 검증 없이 작업을 마치지 못하게 합니다

<p class="keep-with-next">턴을 마치기 전에 계약 테스트를 실행하고, 실패하면 실패 내용을 프롬프트로 돌려줘 작업을 이어 가게 하는 훅입니다.</p>

```bash .codex/hooks/verify-before-stop.sh
#!/usr/bin/env bash
# Stop: 턴을 마치기 전에 GET /users/:id 계약 테스트를 실행한다.
# 실패하면 한 번은 실패 내용과 함께 작업을 이어 가게 하고, 두 번째에는 멈추게 둔다.
set -uo pipefail
input=$(cat)
cd "$(git rev-parse --show-toplevel)"

if git diff --quiet HEAD -- src/; then
  echo '{}'    # 서버 코드를 바꾸지 않은 턴은 검사하지 않는다
  exit 0
fi
if out=$(pnpm test:contract 2>&1); then
  echo '{}'
  exit 0
fi
if [ "$(jq -r '.stop_hook_active' <<<"$input")" = "true" ]; then
  echo '{}'    # 이미 한 번 이어 갔으므로 같은 실패로 반복하지 않는다
  exit 0
fi
jq -n --arg log "$(tail -n 20 <<<"$out")" \
  '{decision: "block", reason: ("계약 테스트가 실패했습니다. 실패 내용을 보고 원인을 고친 뒤 다시 확인하세요.\n" + $log)}'
```

3장의 루프에서는 Codex가 스스로 `verify.sh`를 실행하고 실패 메시지를 읽었습니다. 이 훅은 그 루프의 한 바퀴를 Codex의 판단과 상관없이 돌게 합니다. 실패하면 실패 내용이 다음 프롬프트가 되기 때문입니다. `stop_hook_active`로 두 번째 실패에서는 막지 않는 것은, 3장에서 스킬에 넣은 “같은 실패가 두 번 나오면 멈춘다”를 훅에서도 지키기 위해서입니다. 서버 코드를 바꾸지 않은 턴에서 검사를 건너뛰는 것은 4장의 Efficiency, 곧 비용 때문입니다.

<p class="keep-with-next">두 훅을 등록하는 설정입니다. 경로는 공식 문서의 권장대로 git 루트를 기준으로 씁니다. [@05]</p>

```json .codex/hooks.json
{
  "description": "사용자 조회 API 작업의 검증 훅",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "^apply_patch$",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$(git rev-parse --show-toplevel)/.codex/hooks/guard-legacy.sh\"",
            "statusMessage": "레거시 엔드포인트 수정 여부 확인"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$(git rev-parse --show-toplevel)/.codex/hooks/verify-before-stop.sh\"",
            "timeout": 300,
            "statusMessage": "계약 테스트 실행"
          }
        ]
      }
    ]
  }
}
```

### 스킬, 훅, CI가 맡는 일

훅이 생겼다고 다른 장치가 필요 없어지지는 않습니다. 2장에서 `verify.sh`는 에이전트가 실행할 때만 의미가 있으므로, 반드시 지켜야 하는 검사는 같은 검사를 CI에도 두어 병합 전에 판정하게 한다고 했습니다. 스킬, 훅, CI가 맡는 일을 나란히 놓으면 다음과 같습니다.

| | 스킬 | 훅 | CI |
|---|---|---|---|
| 작동 조건 | 선택되고 제대로 읽혀야 한다 | 이벤트가 일어나면 항상 | PR마다 항상 |
| 작동 시점 | 작업 중 | 작업 중 (도구 실행 전후, 턴 종료) | 병합 전 |
| 잘 맞는 일 | 판단이 필요한 절차 | 매번 같은 방식으로 지킬 검사와 금지 | 최종 판정 |
| 이 사례에서 | 화면에서 출발해 대상을 확정한다 | 레거시 수정 차단, 종료 전 계약 테스트 | `GET /users/:id` 계약 테스트 |

판단이 필요한 일을 훅으로 옮기면 안 됩니다. 요청이 어느 화면에서 왔는지 찾는 일은 스크립트로 정할 수 없으므로 스킬에 남깁니다. 반대로 매번 같은 방식으로 지켜야 하는 일을 스킬에만 두면, 4장에서처럼 스킬이 선택되지 않거나 잘못 읽힐 때 함께 빠집니다.

> [!주의]
> 공식 문서는 도구 훅을 “완전한 강제 경계가 아니라 유용한 안전장치”로 다루라고 합니다. 웹 검색 같은 호스팅 도구는 `PreToolUse`와 `PostToolUse`로 가로챌 수 없고, 같은 이벤트에 걸린 훅 여러 개는 동시에 실행되며, 프로젝트의 훅은 사용자가 검토하고 신뢰해야 실행됩니다. [@05] 그래서 훅이 있어도 같은 계약 테스트를 CI에 두고, 최종 판정은 CI가 맡습니다.
