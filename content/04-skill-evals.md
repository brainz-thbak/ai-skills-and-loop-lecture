---
id: chapter-04
num: "04"
title: 스킬의 품질을 평가하려면 독립적인 기준이 필요합니다
---

### 스킬의 한 줄은 이후의 작업 전부에 영향을 줍니다

3장에서 스킬의 '실패했을 때' 항목에 세 항목을 추가했습니다. 루프 한 번에서 얻은 교훈을 남긴 것이니 좋은 변경처럼 보입니다. 하지만 스킬은 그 작업 한 번이 아니라, 앞으로 `description`에 맞는 모든 작업에서 읽힙니다. 고친 한 줄은 좋은 쪽이든 나쁜 쪽이든 이후의 작업 전부에 영향을 줍니다.

좋아 보이는 변경이 실제로도 좋다는 보장은 없습니다. 스킬은 코드처럼 컴파일되지 않고 실행할 때마다 해석되므로, 부작용은 문장을 읽어서는 보이지 않고 실행해 봐야 드러납니다. 시간이 지나며 달라지기도 합니다. 이전 모델에는 테스트를 실행하라고 독려하는 지침이 필요했지만, 스스로 테스트하는 모델에서는 같은 지침이 불필요한 테스트로 이어질 수 있습니다. [@07]

| | 코드를 바꿀 때 | 스킬을 바꿀 때 |
|---|---|---|
| 영향을 받는 곳 | 그 코드를 호출하는 곳 | `description`에 맞는 모든 작업 |
| 동작 | 같은 입력이면 같은 결과 | 실행할 때마다 해석이 달라질 수 있다 |
| 회귀를 잡는 방법 | 테스트, CI | 평가 |

### 3장에서 추가한 줄이 작업을 멈춰 세웠습니다

3장 끝의 스킬을 v2라고 부르겠습니다. v2를 쓰기 시작한 뒤, 스킬이 가장 잘 처리해야 할 요청에서 문제가 생겼습니다.

<p class="keep-with-next">요청은 “설정 화면에 마지막 로그인 시각이 보이도록 사용자 조회 응답에 lastLoginAt을 추가해 줘”였고, Codex의 보고는 다음과 같았습니다.</p>

```text Codex의 보고
users.controller.test.ts의 기존 기대값을 바꿔야 테스트가 통과합니다.
스킬의 '실패했을 때' 기준에 따라 변경하지 않고 보고합니다.
```

3장에서 추가한 “기존 필드의 테스트 기대값을 바꾸거나 지워야 통과한다면 바꾸지 말고 보고한다”가 원인입니다. 3장의 갈림길 1에서 보았듯 기대값에 새 필드를 **추가**하는 것은 허용되는 변경입니다. 그런데 Codex는 이것도 ‘기대값을 바꾸는 것’으로 읽고 멈췄습니다. 루프 한 번에서 얻은 교훈이 원래 잘 되던 작업을 망가뜨린 것입니다.

이 문제는 스킬을 읽어서는 보이지 않았습니다. 이번에는 우연히 발견했지만, 스킬을 바꿀 때마다 이런 문제를 찾아내려면 체계적인 평가가 필요합니다.

### 스킬은 이렇게 평가합니다

OpenAI는 스킬 평가를 프롬프트, 그 프롬프트로 실행한 기록, 기록에 대한 몇 가지 검사, 그리고 시간에 따라 비교할 수 있는 점수로 정의합니다. [@03]

<div aria-label="평가 과제에서 실행 기록, 검사, 점수로 이어지는 평가의 흐름" class="diagram" role="img">
<div class="diagram-steps">
<div><span class="diagram-kicker">1</span><strong>과제</strong><small>프롬프트 + 고정된 저장소 상태</small></div>
<span class="diagram-arrow">→</span>
<div><span class="diagram-kicker">2</span><strong>실행 기록</strong><small>codex exec --json</small></div>
<span class="diagram-arrow">→</span>
<div><span class="diagram-kicker">3</span><strong>검사</strong><small>결정적 검사 우선</small></div>
<span class="diagram-arrow">→</span>
<div><span class="diagram-kicker">4</span><strong>점수</strong><small>버전별 비교</small></div>
</div>
</div>

판정은 결과와 과정을 나눠서 합니다. 결과는 작업이 완료되었는지, 과정은 스킬을 쓰고 의도한 도구와 단계를 따랐는지입니다. [@03] 여기에 스킬이 쓰여야 할 때만 쓰였는지와 비용을 더하면 다음 네 축이 됩니다. 1장의 품질 차원도 이 네 축으로 측정할 수 있습니다.

| 축 | 묻는 것 | 판정 근거 | 1장의 품질 차원 |
|---|---|---|---|
| Outcome | 요구사항을 충족했나 | 실행이 끝난 뒤 채점기가 따로 돌리는 과제별 검사 | Correctness, Regression Safety |
| Process | 정해진 절차를 따랐나 | 끝까지 수행할 과제는 마지막 `verify.sh` 실행이 성공했는가, 멈춰야 할 과제는 변경 없이 보고했는가 | Process Consistency |
| Invocation | 써야 할 때만 스킬을 썼나 | `should_trigger`와 실제 활성화 여부가 일치하는가 | 해당 없음 |
| Efficiency | 비용이 적절한가 | 토큰 사용량, 명령 실행 횟수 | Cost |

검사는 결정적인 것부터 둡니다. 명령이 성공했는지, 토큰을 얼마나 썼는지, 같은 명령을 몇 번 되풀이했는지는 실행 기록에서 바로 셀 수 있습니다. [@03] 완료 보고가 충실한지처럼 정답이 하나가 아닌 항목에는 모델 검토를 보조로 쓸 수 있지만, 모델 검토기는 오탐이 많습니다. 저장소에 접근하고 코드를 실행할 수 있게 하면 오탐이 줄어듭니다. [@13]

Invocation은 `should_trigger`를 Codex의 스킬 호출 로그와 대조해 채점할 수 있습니다. 이 절의 `codex exec --json` 예제는 스킬 전용 파일이 명령에 등장했는지를 간접 신호로 기록합니다. 이 신호가 없으면 활성화 여부는 미확인입니다. 호출 로그의 수집과 활용은 재평가 직전의 실사용 기록 절에서 다룹니다. [@04][@25]

### 평가 과제를 만들고 돌립니다

공식 글은 작은 CSV 하나로 시작하고, 스킬 하나에는 10~20개의 프롬프트면 충분하며, 스킬이 쓰이지 **않아야** 하는 프롬프트도 넣으라고 권합니다. [@03] 여기서는 지금까지의 사례로 과제를 구성합니다.

스킬을 처음 도입할 때는 스킬이 없는 상태를, 기존 스킬을 고칠 때는 현재 버전을 비교 기준으로 삼습니다. [@23] `description`을 평가할 때는 같은 요청의 여러 표현과 헷갈리기 쉬운 요청을 함께 넣습니다. 아래의 n2처럼 대상 파일이 같아도 사용자의 목적이 다른 요청이 경계를 시험합니다. [@24]

```csv evals/api-response-change.csv
id,should_trigger,fixture,prompt
t1,true,single-endpoint,설정 화면에 마지막 로그인 시각이 보이도록 사용자 조회 응답에 lastLoginAt을 추가해 줘
t2,true,duplicate-endpoints,프로필 화면에 이미지가 보이도록 사용자 조회 API에 avatarUrl을 추가해 줘
t3,true,missing-column,프로필 화면에 이미지가 보이도록 사용자 조회 API에 avatarUrl을 추가해 줘
t4,true,single-endpoint,프로필 화면에서 쓰도록 사용자 조회 응답의 name을 displayName으로 바꿔 줘
n1,false,single-endpoint,README의 오탈자를 고쳐 줘
n2,false,single-endpoint,users.controller.ts의 중복 코드를 함수로 추출해 줘. 응답은 바꾸지 않는다
```

| 과제 | 출처 | 정답이 되는 행동 |
|---|---|---|
| t1 | 위의 문제 | 필드를 추가하고, 테스트 기대값에도 새 필드를 추가해 통과시킨다 |
| t2 | 서론 | 같은 역할의 엔드포인트 가운데 `GET /users/:id`를 고친다 |
| t3 | 3장 | 조회 쿼리까지 고친다 |
| t4 | 2장의 호환성 기준 | 이름 변경은 금지이므로 바꾸지 않고 보고한다 |
| n1, n2 | | 각 요청을 완료하고 스킬은 활성화하지 않는다 |

저장소 상태는 과제마다 브랜치로 고정해 두고, 실행할 때마다 새 작업 공간에서 시작합니다.

<p class="keep-with-next"><code>codex exec</code><span class="badge codex">Codex 전용</span>에 <code>--json</code>을 붙이면 명령 실행과 토큰 사용량 등의 이벤트를 표준 출력에 JSONL로 남깁니다. [@04] 과제마다 정해진 횟수만큼 실행하고, 실행이 끝나면 과제별 검사로 Outcome을 따로 판정합니다.</p>

```bash evals/run.sh
#!/usr/bin/env bash
# 사용법: run.sh <스킬 버전> <반복 횟수>    예: run.sh v2 5
set -euo pipefail
version="$1"; repeat="$2"

tail -n +2 evals/api-response-change.csv | while IFS=, read -r id trigger fixture prompt; do
  for i in $(seq "$repeat"); do
    work="$(mktemp -d)"
    out="evals/runs/${version}/${id}-${i}"
    mkdir -p "$out"
    git worktree add -q --detach "$work" "fixtures/${fixture}"
    mkdir -p "$work/.agents/skills/api-response-change"
    cp -r "evals/skills/${version}/." "$work/.agents/skills/api-response-change/"

    (cd "$work" && codex exec --json --sandbox workspace-write "$prompt" < /dev/null) \
      > "$out/trace.jsonl"
    if "evals/checks/${id}.sh" "$work" > "$out/check.log" 2>&1; then
      echo pass > "$out/outcome"
    else
      echo fail > "$out/outcome"
    fi
    git worktree remove --force "$work"
  done
done
```

> [!주의]
> 공식 평가 글의 일부 예시에는 `--full-auto` 옵션이 나오지만, 현재 Codex 문서는 이 옵션을 더 이상 지원하지 않는다고 밝힙니다. 파일을 써야 하는 실행에는 `--sandbox workspace-write`를 씁니다. 기본값은 읽기 전용 샌드박스입니다. [@03][@04]

<p class="keep-with-next">실행 기록에서 명령 실행 항목과 토큰 사용량은 다음과 같은 형태로 남습니다. 형식은 공식 문서의 예시를 따랐고, 값은 설명을 위해 만든 것입니다. [@04] 채점 스크립트는 이 두 종류의 줄을 읽습니다.</p>

```text evals/runs/v2/t2-1/trace.jsonl (일부)
{"type":"item.completed","item":{"id":"item_19","type":"command_execution","command":"bash -lc 'scripts/verify.sh /users/42 avatarUrl'","status":"completed","exit_code":0}}
{"type":"turn.completed","usage":{"input_tokens":184210,"cached_input_tokens":151040,"output_tokens":6382,"reasoning_output_tokens":2910}}
```

```bash evals/grade.sh
#!/usr/bin/env bash
# 사용법: grade.sh <실행 결과 디렉터리>    예: grade.sh evals/runs/v2/t2-1
set -euo pipefail
dir="$1"; trace="$dir/trace.jsonl"
commands='[.[] | select(.type == "item.completed") | .item | select(.type == "command_execution")]'

process=$(jq -s "$commands | map(select(.command | test(\"scripts/verify.sh\"))) | (last // {}) | .exit_code == 0" "$trace")
skill_file_signal=$(jq -s "$commands | any(.command | test(\"scripts/verify.sh|references/compatibility.md\"))" "$trace")
count=$(jq -s "$commands | length" "$trace")
tokens=$(jq -s '[.[] | select(.type == "turn.completed") | .usage.input_tokens + .usage.output_tokens] | add' "$trace")

echo "$(basename "$dir") outcome=$(cat "$dir/outcome") process=$process skill_file_signal=$skill_file_signal commands=$count tokens=$tokens"
```

이 스크립트의 `process`는 끝까지 수행해야 하는 과제를 위한 값입니다. t4처럼 멈추는 것이 정답인 과제는 `verify.sh`를 실행하지 않으므로, Process도 과제별 검사, 곧 변경 없이 보고했는지로 판정합니다.

> [!주의]
> 실행 기록은 판정의 근거일 뿐 판정 자체가 아닙니다. 기록에 `verify.sh` 성공이 남아 있어도 Outcome은 채점기가 따로 실행한 과제별 검사로 판정합니다. 서론의 Codex처럼 에이전트가 엉뚱한 대상을 검증하고 통과했을 수 있기 때문입니다.

<p class="keep-with-next">v2를 과제마다 다섯 번씩 실행한 결과입니다. 수치는 설명을 위해 만든 예시입니다. ‘스킬 활성화’는 평가 환경에서 활성화 여부를 직접 확인할 수 있다고 가정한 값입니다.</p>

| 과제 | Outcome 통과 | 스킬 활성화 | 비고 |
|---|---|---|---|
| t1 | 2/5 | 5/5 | 세 번은 기대값 추가를 ‘변경’으로 보고 멈췄다 |
| t2 | 5/5 | 5/5 | |
| t3 | 4/5 | 5/5 | |
| t4 | 5/5 | 5/5 | 모두 바꾸지 않고 보고했다 |
| n1, n2 | 5/5 | 0/5 | 스킬이 쓰이지 않았다 (정답) |

우연히 발견했던 문제가 t1의 숫자로 드러났습니다. 이제 이 숫자를 기준으로 스킬을 고칩니다.

### 스킬을 고칩니다

```diff SKILL.md (v2 → v3)
 ## 실패했을 때
 - 1에서 호출 지점을 찾지 못하면 추측해서 고르지 말고 멈추고 보고한다.
 - 5가 실패하면 대상 엔드포인트를 바꾸지 말고 원인을 고친다.
 - 실패한 단계(타입 검사, 테스트, 응답 확인)를 먼저 구분하고, 통과한
   단계를 근거로 원인의 범위를 좁힌 뒤 실제 값을 확인하고 고친다.
 - 기존 필드의 테스트 기대값을 바꾸거나 지워야 통과한다면 바꾸지 말고 보고한다.
+  새 필드를 기대값에 추가하는 것은 여기에 해당하지 않는다.
 - 다시 진단하고 고쳐도 같은 실패 메시지가 나오면 멈추고 지금까지의 시도를 보고한다.
```

새 규칙을 덧붙이지 않고, 기존 규칙에 예외 한 줄을 더해 범위를 분명히 했습니다. 스킬의 복잡도는 결과가 실제로 나아질 때만 늘리는 편이 좋습니다. [@08] 고친 뒤에는 같은 과제로 다시 평가합니다. 생성과 평가를 반복하는 방식은 평가 기준이 분명하고 반복할수록 측정 가능한 개선이 있을 때 효과적입니다. [@08]

<h3 id="skill-operations">실사용 기록에서 다음 평가 기준을 찾습니다</h3>

#### 호출을 기록하는 이유

Outcome, Process, Invocation, Efficiency는 무엇을 볼지 정하는 틀입니다. 실제 사용 기록을 읽으면 그중 어디에 어떤 검사가 더 필요한지 알 수 있습니다. 여러 요청에서 기대한 행동과 실제 행동이 처음 갈라진 지점을 적고, 비슷한 실패를 묶습니다. 자주 반복되거나 영향이 큰 실패부터 재현할 과제와 합격 기준을 만듭니다. [@21][@28][@29]

앞에서 본 `lastLoginAt` 요청을 실사용 기록으로 검토한다고 합시다. 화면에 값이 나오지 않았다는 결과만 보면 스킬이 선택되지 않았는지, 선택된 뒤 절차가 어긋났는지 알기 어렵습니다. 같은 요청의 기록을 연결하면 어디부터 볼지 좁힐 수 있습니다.

| 확인할 기록 | `lastLoginAt` 실행에서 확인한 것 |
|---|---|
| 요청과 실행 조건 | 설정 화면에 마지막 로그인 시각을 표시하는 요청입니다. 이 실행에는 스킬 v2가 설치돼 있었습니다. |
| 호출 기록 | Codex가 `api-response-change`를 사용했습니다. |
| 실행 과정 | 새 필드를 테스트 기대값에 추가해야 하는 상황에서 기존 기대값 변경 금지 규칙을 적용해 멈췄습니다. 기대한 절차와 처음 갈라진 지점입니다. |
| 독립적으로 확인한 결과 | `GET /users/:id` 응답에 `lastLoginAt`이 없어서 요구사항을 충족하지 못했습니다. |

호출된 사실을 확인했으므로 이 사례에서는 스킬 본문의 중단 규칙부터 살펴봅니다. 같은 실패가 다른 필드 추가 요청에서도 반복되는지 확인하면, 한 요청의 표현에만 맞춘 예외를 추가할 가능성을 줄일 수 있습니다. [@29]

#### Codex에서 호출과 실행을 연결해 기록합니다

Hitachi의 기업용 가이드는 호출 단위로 기록을 남기고 식별자로 상위 요청과 연결할 것을 권장합니다. Minedia의 운영 사례에서는 스킬을 에이전트가 선택했는지 사용자가 지정했는지 구분해 집계합니다. 이 강의에서는 호출 기록을 같은 요청의 작업 과정과 독립 검사에 연결합니다. 비교할 스킬 버전과 저장소 상태도 실행별로 남깁니다. [@20][@27][@28]

**일반 Codex 대화에서도 에이전트가 스스로 선택한 스킬을 감지하면 `codex.skill_invocation`에 `implicit`으로 기록합니다.** 사용자 프롬프트에 `$스킬명`을 넣을 필요는 없습니다. Codex는 이 이벤트를 `otel.exporter`로 지정한 OpenTelemetry 수집기에 전송합니다. `codex exec --json`으로 평가를 돌리면 명령과 결과 등 실행 기록은 별도로 표준 출력에 남습니다. 이 실습은 Codex CLI 0.172.0을 기준으로 합니다. [@04][@18][@25][@26]

<p class="keep-with-next">아래는 일반 대화에서 Codex가 <code>api-response-change</code>를 스스로 선택한 경우의 기록 예시입니다. 수집기는 필요한 필드를 골라 이벤트마다 JSONL 한 줄을 저장합니다. [@25]</p>

```json skill-calls.jsonl (호출 한 건, 읽기 좋게 펼친 예)
{
  "event": "codex.skill_invocation",
  "timestamp": "2026-11-27T04:18:12.430Z",
  "conversation_id": "604e64da-89a2-4846-a3c8-b39288f55f9b",
  "turn_id": "7bd7ed77-37c6-4e00-bc56-abcb7917b85e",
  "skill_name": "api-response-change",
  "invocation_type": "implicit"
}
```

`explicit`은 명시 지정, `implicit`은 Codex가 감지한 스킬 사용입니다. 한 턴에 두 유형이 함께 기록될 수 있으므로 스킬이 쓰인 턴을 셀 때는 대화 ID·턴 ID·스킬 이름으로 묶습니다. 스킬 버전은 평가 실행기가 설치한 버전을 따로 기록합니다. [@25]

#### 발견한 실패를 합격 기준으로 바꿉니다

`lastLoginAt` 사례를 재현하려면 응답 전체를 비교하는 기존 테스트가 있는 초기 상태를 고정합니다. **합격 기준은 실제 응답이 기대한 `lastLoginAt` 값을 반환하고, 테스트에는 새 필드의 기대값이 추가되며, 기존 필드의 계약을 계속 만족하는 것**입니다. 채점기는 대상 API를 직접 호출하고 기존 계약과 테스트를 확인합니다. 호출 로그는 Invocation의 근거로, 명령 기록은 Process의 근거로 씁니다. Outcome은 독립 검사로 판정합니다. [@03][@21]

기준을 확정한 뒤 같은 과제와 채점기로 v2와 v3를 비교합니다. 다음 절에서 t1의 불필요한 중단이 줄었는지 보고, t4의 이름 변경 요청에서는 여전히 멈추는지 확인합니다. 개선에 쓰지 않은 주문 조회 같은 보류 과제에서도 같은 기준을 적용합니다. 실제 사용 중 스킬이 필요한 요청에서 빠지는 일이 반복된다면, 그 요청도 `should_trigger=true` 과제로 등록하고 `description`의 적용 조건을 점검합니다. [@21][@24][@28][@29]

#### 실습. 스킬 폴더에 자동 호출 기록을 남깁니다

실습 저장소에 2장의 프로토콜형 스킬 예시를 `.agents/skills/api-response-change/SKILL.md`로 저장합니다. 그 아래에 `otel/`을 만들고 수집기를 둡니다. 수집기는 스킬 폴더명과 `skill.name`이 일치하는 호출만 골라 `otel/skill-calls.jsonl`에 추가합니다. [@19][@25]

<p class="keep-with-next">Codex를 실행하는 쪽의 사용자 설정 파일 <code>~/.codex/config.toml</code>에 아래 값을 넣습니다. <code>CODEX_HOME</code>을 따로 지정했다면 그 디렉터리의 <code>config.toml</code>을 엽니다. 이미 <code>[otel]</code> 블록이 있으면 그 안에서 두 키를 설정합니다. 이 실습에서는 수집기와 Codex를 같은 컴퓨터에서 실행합니다. [@25][@26]</p>

```toml ~/.codex/config.toml
[otel]
log_user_prompt = false
exporter = { otlp-http = { endpoint = "http://localhost:4318/v1/logs", protocol = "json" } }
```

<p class="keep-with-next">다음 코드를 <code>.agents/skills/api-response-change/otel/collect-skill-calls.py</code>로 저장합니다. 로그 경로는 수집기 파일의 위치를 기준으로 정합니다. [@22][@25]</p>

```python collect-skill-calls.py
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from os import getenv
from pathlib import Path

OTEL_DIR = Path(__file__).resolve().parent
SKILL_NAME = OTEL_DIR.parent.name
LOG_PATH = OTEL_DIR / "skill-calls.jsonl"
FIELDS = {
    "event": "event.name",
    "timestamp": "event.timestamp",
    "conversation_id": "conversation.id",
    "turn_id": "turn.id",
    "skill_name": "skill.name",
    "invocation_type": "skill.invocation_type",
}


class SkillLogReceiver(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/v1/logs":
            self.send_error(404)
            return

        try:
            payload = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        except (TypeError, ValueError):
            self.send_error(400, "Expected an OTLP JSON body")
            return

        for resource in payload.get("resourceLogs", []):
            for scope in resource.get("scopeLogs", []):
                for record in scope.get("logRecords", []):
                    if record.get("eventName") != "codex.skill_invocation":
                        continue
                    attrs = {a["key"]: a["value"].get("stringValue")
                             for a in record.get("attributes", [])}
                    if attrs.get("skill.name") != SKILL_NAME:
                        continue
                    row = {field: attrs.get(key) for field, key in FIELDS.items()}
                    with LOG_PATH.open("a", encoding="utf-8") as log:
                        log.write(json.dumps(row, ensure_ascii=False) + "\n")

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b"{}")


with HTTPServer(("localhost", int(getenv("SKILL_LOG_PORT", "4318"))), SkillLogReceiver) as server:
    server.serve_forever()
```

```bash 수집기 실행
python3 .agents/skills/api-response-change/otel/collect-skill-calls.py
```

같은 이름의 스킬을 여러 저장소에서 사용한다면 `SKILL_LOG_PORT`로 수집기마다 다른 포트를 정하고, 각 Codex 실행의 `otel.exporter`에 해당 포트를 지정합니다. 호출 이벤트의 스킬 이름만으로는 두 저장소를 구분할 수 없습니다. [@25][@26]

다른 터미널에서 실습 저장소로 이동해 `codex --sandbox read-only`로 Codex를 새로 시작합니다. 앱이나 IDE에서 실습한다면 Codex 프로세스를 재시작해 설정을 읽게 합니다. 채팅에는 아래처럼 업무만 요청합니다. [@18][@25][@26]

```text Codex 채팅에 보낼 요청
설정 화면에 마지막 로그인 시각이 보이도록 사용자 조회 응답에 lastLoginAt을 추가하려고 해. 코드 수정 전에 화면이 실제로 호출하는 경로와 검증 계획부터 확인해 줘.
```

<p class="keep-with-next">실습 저장소의 루트에서 자동 호출을 확인합니다. 전송은 일괄 처리되므로 응답 직후 기록이 보이지 않으면 잠시 기다리거나 채팅을 정상 종료한 뒤 확인합니다. [@25][@26]</p>

```bash 자동 호출 확인
jq -c 'select(.invocation_type == "implicit")' \
  .agents/skills/api-response-change/otel/skill-calls.jsonl
```

<p class="keep-with-next">평가 실행에서도 같은 수집기를 사용합니다. <code>evals/run.sh</code>에 CSV의 요청을 그대로 넘기고, <code>codex exec --json</code>이 만든 실행 기록을 호출 로그와 대화 ID로 연결합니다. 아래 명령은 v2에서 t1을 처음 실행한 기록을 찾습니다. [@04][@25]</p>

```bash 한 실행의 호출 기록 찾기
trace=evals/runs/v2/t1-1/trace.jsonl
conversation_id=$(jq -er 'select(.type == "thread.started") | .thread_id' "$trace")
jq -c --arg id "$conversation_id" 'select(.conversation_id == $id)' \
  .agents/skills/api-response-change/otel/skill-calls.jsonl
```

스킬이 필요했던 요청에서 이벤트가 빠졌다면 수집기가 동작했는지와 실행 기록을 함께 확인합니다. Codex의 셸 기반 암시적 사용 감지에는 누락이 생길 수 있어, 증거가 부족하면 사용 여부를 미확인으로 남깁니다. 로컬 평가에서 수집기를 띄우지 않고 한 건씩 확인할 때는 `RUST_LOG=warn,codex_otel.log_only=info`를 설정해 `codex exec`의 표준 오류에서 같은 호출 이벤트를 찾을 수도 있습니다. 이 방법은 Codex CLI 0.172.0의 진단용 텍스트 로그를 사용합니다. [@25][@30]

### 다시 평가합니다

<div aria-label="같은 과제와 같은 저장소 상태로 스킬 v2와 v3를 각각 여러 번 실행해 네 축으로 비교하는 구조" class="ab-figure" role="img">
<div class="ab-head">같은 과제 · 같은 저장소 상태 · 같은 채점기</div>
<div class="ab-cols"><div><strong>스킬 v2</strong><small>과제마다 5회 실행</small></div><div><strong>스킬 v3</strong><small>과제마다 5회 실행</small></div></div>
<div class="ab-foot">Outcome · Process · Invocation · Efficiency</div>
<div class="ab-caption">개선에 쓰지 않은 보류 과제로도 같은 비교를 한다.</div>
</div>

| 과제 | Outcome 통과 (v2 → v3) | 스킬 활성화 (v2 → v3) | 평균 명령 실행 횟수 (v2 → v3) |
|---|---|---|---|
| t1 | 2/5 → 5/5 | 5/5 → 5/5 | 12 → 15 |
| t2 | 5/5 → 5/5 | 5/5 → 5/5 | 22 → 22 |
| t3 | 4/5 → 4/5 | 5/5 → 5/5 | 29 → 30 |
| t4 | 5/5 → 5/5 | 5/5 → 5/5 | 18 → 18 |
| n1, n2 | 5/5 → 5/5 | 0/5 → 0/5 | 6 → 6 |

t1이 나아졌고 나머지는 그대로입니다. 특히 t4가 그대로라는 점이 중요합니다. 예외를 더한 뒤에도 기존 필드의 이름을 바꾸는 요청에서는 여전히 멈췄으므로, 고친 줄이 원래 막아야 할 것까지 풀어 주지는 않았습니다. t1의 명령 실행 횟수가 늘어난 것은 멈추던 작업을 이제 끝까지 수행했기 때문입니다.

그래도 아직 v3가 낫다고 결론 내리기에는 이릅니다. t1은 v3를 만들 때 본 사례이므로, v3가 이 과제에만 맞춰졌을 수 있습니다. 개선에 쓰지 않은 보류 과제, 예를 들어 주문 조회 응답에 필드를 추가하는 과제를 따로 두고 같은 비교를 해서 나아졌을 때 비로소 스킬이 나아졌다고 말할 수 있습니다.

> [!주의]
> 에이전트의 실행 결과는 매번 달라집니다. 다섯 번 중 두 번과 다섯 번의 차이도 실행 횟수가 적으면 우연일 수 있습니다. 한 번의 성공이나 작은 차이로 일반화하지 말고, 반복 횟수를 늘리거나 보류 과제로 다시 확인합니다.

3장의 루프에서는 작업 중 실패를 보고 코드를 고쳤습니다. 여기서는 실사용에서 확인한 실패를 평가 기준으로 만들고, 그 기준으로 일하는 방법을 고칩니다. 평가 결과는 여러 과제에서 스킬이 얼마나 자주 제대로 작동했는지 보여 줍니다. 매번 지켜야 하는 검사는 5장에서 훅과 CI에 연결합니다.
