---
id: s-chapter-01
num: "01"
title: 보고와 증거를 나눕니다
---

<div aria-label="요구사항 경로에는 변경이 없고 Codex가 검증한 경로에만 필드가 있다는 비교" class="path-figure" role="img">
<div class="path-row path-row--req">
<span class="path-label">요구사항이 가리키는 경로</span>
<div class="path-chain"><span class="path-node">프로필 화면</span><span class="path-arrow">→</span><span class="path-node"><code>GET /users/:id</code></span></div>
<span class="badge fail">변경 없음</span>
</div>
<div class="path-row">
<span class="path-label">Codex가 고치고 검증한 경로</span>
<div class="path-chain"><span class="path-node">테스트 · curl</span><span class="path-arrow">→</span><span class="path-node"><code>GET /api/v2/users/:id</code></span></div>
<span class="badge pass">필드 있음</span>
</div>
</div>

| 핵심 | 이 사례에서 |
|---|---|
| 에이전트의 보고는 요약일 뿐 실행 결과가 아니다 | 보고 세 문장이 모두 사실이었지만 대상이 달랐다 |
| 대상이 맞아도 **검사 범위**가 남는다 | 테스트는 목을 썼고, 실제 쿼리는 컬럼을 읽지 않아 늘 `null` |
| 대상이 맞아도 **회귀**가 남는다 | `name`을 바꾸며 테스트 기대값도 고쳐 통과시켰다 |
| **품질**과 **품질의 증거**는 다르다 | 증거는 충분(Verifiability 통과), 요구사항은 실패(Correctness 실패) |
| 완료 보고에는 확인하지 못한 것도 적는다 | 리뷰어가 어디부터 의심할지 알 수 있다 |

<div class="cards cols-2">
<div class="card"><span class="card-kicker">부족했던 것</span><strong>성실함이 아니라 기준과 순서</strong><span>“꼼꼼히 확인해 줘”는 무엇을, 어디까지 확인할지 정하지 않는다</span></div>
<div class="card accent"><span class="card-kicker">다음 장으로</span><strong>기준과 순서를 절차로 남긴다</strong><span>화면에서 출발 → 같은 역할의 엔드포인트 확인 → 그 엔드포인트로 검증</span></div>
</div>

<p class="see-also">→ <a href="./#chapter-01">본문 1장</a></p>
