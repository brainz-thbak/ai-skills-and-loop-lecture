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
| Invocation | 써야 할 때만 스킬을 썼나 | `should_trigger`와 실제 사용 여부가 일치하는가 | 해당 없음 |
| Efficiency | 비용이 적절한가 | 토큰 사용량, 명령 실행 횟수 | Cost |

검사는 결정적인 것부터 둡니다. 명령이 성공했는지, 토큰을 얼마나 썼는지, 같은 명령을 몇 번 되풀이했는지는 실행 기록에서 바로 셀 수 있습니다. [@03] 완료 보고가 충실한지처럼 정답이 하나가 아닌 항목에는 모델 검토를 보조로 쓸 수 있지만, 모델 검토기는 오탐이 많습니다. 저장소에 접근하고 코드를 실행할 수 있게 하면 오탐이 줄어듭니다. [@13] 스킬이 쓰였는지를 기록에서 가려내는 방법은 공식 글에 나와 있지 않으므로, 이 자료에서는 스킬에만 있는 파일, 곧 `scripts/verify.sh`나 `references/compatibility.md`를 쓴 흔적이 기록에 남았는지로 판정합니다.

### 평가 과제를 만들고 돌립니다

공식 글은 작은 CSV 하나로 시작하고, 스킬 하나에는 10~20개의 프롬프트면 충분하며, 스킬이 쓰이지 **않아야** 하는 프롬프트도 넣으라고 권합니다. [@03] 여기서는 지금까지의 사례로 과제를 구성합니다.

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
| n1, n2 | | 스킬을 쓰지 않는다 |

저장소 상태는 과제마다 브랜치로 고정해 두고, 실행할 때마다 새 작업 공간에서 시작합니다.

<p class="keep-with-next"><code>codex exec</code><span class="badge codex">Codex 전용</span>에 <code>--json</code>을 붙이면 표준 출력이 JSONL 이벤트 스트림이 되어 실행 중에 일어난 일을 모두 기록할 수 있습니다. [@04] 과제마다 정해진 횟수만큼 실행하고, 실행이 끝나면 과제별 검사로 Outcome을 따로 판정합니다.</p>

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
invoked=$(jq -s "$commands | any(.command | test(\"scripts/verify.sh|references/compatibility.md\"))" "$trace")
count=$(jq -s "$commands | length" "$trace")
tokens=$(jq -s '[.[] | select(.type == "turn.completed") | .usage.input_tokens + .usage.output_tokens] | add' "$trace")

echo "$(basename "$dir") outcome=$(cat "$dir/outcome") process=$process invoked=$invoked commands=$count tokens=$tokens"
```

이 스크립트의 `process`는 끝까지 수행해야 하는 과제를 위한 값입니다. t4처럼 멈추는 것이 정답인 과제는 `verify.sh`를 실행하지 않으므로, Process도 과제별 검사, 곧 변경 없이 보고했는지로 판정합니다.

> [!주의]
> 실행 기록은 판정의 근거일 뿐 판정 자체가 아닙니다. 기록에 `verify.sh` 성공이 남아 있어도 Outcome은 채점기가 따로 실행한 과제별 검사로 판정합니다. 서론의 Codex처럼 에이전트가 엉뚱한 대상을 검증하고 통과했을 수 있기 때문입니다.

<p class="keep-with-next">v2를 과제마다 다섯 번씩 실행한 결과입니다. 수치는 설명을 위해 만든 예시입니다.</p>

| 과제 | Outcome 통과 | 스킬 사용 | 비고 |
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

### 다시 평가합니다

<div aria-label="같은 과제와 같은 저장소 상태로 스킬 v2와 v3를 각각 여러 번 실행해 네 축으로 비교하는 구조" class="ab-figure" role="img">
<div class="ab-head">같은 과제 · 같은 저장소 상태 · 같은 채점기</div>
<div class="ab-cols"><div><strong>스킬 v2</strong><small>과제마다 5회 실행</small></div><div><strong>스킬 v3</strong><small>과제마다 5회 실행</small></div></div>
<div class="ab-foot">Outcome · Process · Invocation · Efficiency</div>
<div class="ab-caption">개선에 쓰지 않은 보류 과제로도 같은 비교를 한다.</div>
</div>

| 과제 | Outcome 통과 (v2 → v3) | 스킬 사용 (v2 → v3) | 평균 명령 실행 횟수 (v2 → v3) |
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

문제를 찾고, 평가로 확인하고, 스킬을 고치고, 다시 평가하는 이 반복은 3장의 루프를 스킬 수준에서 한 번 더 도는 것입니다. 다만 이번에 판정하는 것은 코드가 아니라 일하는 방법이고, 기준은 작업 한 번의 통과가 아니라 여러 과제에서의 결과입니다. 그래서 평가가 알려 주는 것도 스킬이 얼마나 자주 제대로 작동하는가입니다. 평가로 그 비율을 높일 수는 있지만, 매번 작동하게 만들 수는 없습니다.
