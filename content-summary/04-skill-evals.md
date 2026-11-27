---
id: s-chapter-04
num: "04"
title: 스킬의 변경을 평가합니다
---

<div class="cards">
<div class="card"><span class="card-kicker">왜 1</span><strong>한 줄이 모든 작업에 영향</strong><span><code>description</code>에 맞는 작업마다 읽힌다</span></div>
<div class="card"><span class="card-kicker">왜 2</span><strong>부작용은 읽어서 안 보인다</strong><span>실행할 때마다 해석되므로 돌려 봐야 드러난다</span></div>
<div class="card"><span class="card-kicker">왜 3</span><strong>모델이 바뀌면 달라진다</strong><span>필요하던 지침이 불필요한 행동을 낳기도 한다</span></div>
</div>

> [!주의]
> 3장에서 넣은 “기대값을 바꿔야 하면 보고”를 새 필드 추가에도 적용해, 잘 되던 필드 추가 작업이 멈췄다.

| 평가의 구성 | 방법 |
|---|---|
| 과제 | 프롬프트 10~20개. 스킬이 쓰이면 **안 되는** 과제도 넣는다 |
| 비교 기준 | 처음 도입할 때는 스킬 없이 실행하고, 수정할 때는 현재 버전과 비교한다 |
| 실행 기록 | 고정된 저장소 상태의 새 작업 공간에서 `codex exec --json` <span class="badge codex">Codex 전용</span>을 반복한다 |
| 판정 | Outcome · Process · Invocation · Efficiency. 결정적 검사를 먼저, 모델 검토는 보조로 |

| 개선의 원칙 | 이유 |
|---|---|
| 규칙을 더하지 말고 범위를 분명히 한다 | 복잡도는 결과가 나아질 때만 늘린다 |
| 고친 뒤 같은 과제로 다시 평가한다 | 고치려던 것과 원래 되던 것을 함께 확인한다 |
| 개선에 쓰지 않은 과제로도 확인한다 | 본 사례에만 맞춘 개선일 수 있다 |
| 작은 차이로 일반화하지 않는다 | 실행 결과는 매번 달라진다 |

| 과제 | v2 → v3 (예시) |
|---|---|
| 새 필드 추가 | 2/5 → **5/5** |
| 이름 변경 요청 (멈추는 게 정답) | 5/5 → 5/5 |
| 스킬이 쓰이면 안 되는 과제 | 5/5 → 5/5 |

<p class="see-also">호출·실행·결과 기록에서 처음 어긋난 지점을 찾아 합격 기준을 만듭니다. → <a href="./#skill-operations">본문과 수집 실습</a></p>
