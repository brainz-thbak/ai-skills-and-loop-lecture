---
id: s-chapter-03
num: "03"
title: 실패 메시지로 진단하는 루프
---

| | 재시도 | 피드백 루프 |
|---|---|---|
| 다음 시도의 출발점 | “다시 해 줘”, “꼼꼼히 봐 줘” | 직전의 실패 메시지 |
| 진전의 판단 | 알 수 없다 | 실패의 내용이 바뀌었는가 |
| 판정 | 자기 검토 | 실행 결과 (`verify.sh`) |
| 끝 | 지칠 때까지 | 통과하거나, 멈출 조건에 닿으면 |

<div aria-label="실패 메시지로 진단하는 네 단계" class="diagram" role="img">
<div class="diagram-steps">
<div><span class="diagram-kicker">1</span><strong>단계 구분</strong><small>타입 · 테스트 · 응답 중 어디서?</small></div>
<span class="diagram-arrow">→</span>
<div><span class="diagram-kicker">2</span><strong>범위 축소</strong><small>통과한 검사에는 원인이 없다</small></div>
<span class="diagram-arrow">→</span>
<div><span class="diagram-kicker">3</span><strong>출처 추적</strong><small>응답 → 컨트롤러 → 쿼리 → DB</small></div>
<span class="diagram-arrow">→</span>
<div><span class="diagram-kicker">4</span><strong>재확인</strong><small>같은 메시지면 진단이 틀렸다</small></div>
</div>
</div>

| 갈림길 | 잘못 가면 | 바르게 가면 |
|---|---|---|
| 테스트를 고쳐도 되나 | 기존 기대값을 바꿔 통과 <span class="badge fail">약화</span> | 새 필드만 기대값에 추가 <span class="badge pass">허용</span> |
| 같은 실패가 반복될 때 | 메시지에 나온 곳만 계속 고친다 | 출처를 추적하고, 그래도 같으면 멈춘다 |
| 판정을 무엇에 맡기나 | 자기 검토 (같은 가정을 반복) | 실행 결과 (가정을 공유하지 않음) |

<div class="cards cols-2">
<div class="card warn"><span class="card-kicker">한계</span><strong>실행 결과도 검사한 만큼만 증명한다</strong><span><code>verify.sh</code>는 값이 있는지만 본다. 나머지는 ‘확인하지 못한 것’에</span></div>
<div class="card accent"><span class="card-kicker">긴 루프</span><strong>멈출 조건을 스킬에 되돌려 놓는다</strong><span>진단 순서, 테스트 변경 기준, 반복 실패 시 멈춤</span></div>
</div>

<p class="see-also">→ <a href="./#chapter-03">본문 3장</a></p>
