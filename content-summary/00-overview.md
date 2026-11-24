---
id: s-overview
title: 한 장 요약
---

<div class="cards">
<div class="card warn"><span class="card-kicker">장면</span><strong>v2를 고치고 검증했다</strong><span>테스트 통과, 호출 확인까지 했지만 화면은 <code>GET /users/:id</code>를 쓴다</span></div>
<div class="card warn"><span class="card-kicker">원인</span><strong>절차와 완료 기준이 없었다</strong><span>대상을 정하는 순서가 없고, 완료를 고친 코드 쪽에서 판정했다</span></div>
<div class="card accent"><span class="card-kicker">질문</span><strong>반복해서, 나아졌다고 말하려면?</strong><span>방법을 어떻게 남기고, 바꾼 방법이 나은지 어떻게 아는가</span></div>
</div>

<div aria-label="스킬, 루프, 평가, 훅이 이어지는 이 자료의 흐름" class="diagram" role="img">
<div class="diagram-steps">
<div><span class="diagram-kicker">2장</span><strong>스킬</strong><small>절차를 남긴다</small></div>
<span class="diagram-arrow">→</span>
<div><span class="diagram-kicker">3장</span><strong>루프</strong><small>실패로 진단한다</small></div>
<span class="diagram-arrow">→</span>
<div><span class="diagram-kicker">4장</span><strong>평가</strong><small>여러 과제로 확인한다</small></div>
<span class="diagram-arrow">→</span>
<div><span class="diagram-kicker">5장</span><strong>훅</strong><small>매번 강제한다</small></div>
</div>
<p class="diagram-note">짧은 루프는 지금의 코드를, 긴 루프는 스킬·문서·테스트를 고친다.</p>
</div>

| 장 | 한 줄 요약 | 남기는 것 |
|---|---|---|
| 1 | 보고는 사실이어도 요구사항을 증명하지 못할 수 있다 | 증거가 붙은 완료 보고 |
| 2 | 스킬은 주의 문장이 아니라 트리거·단계·완료 조건이다 | `SKILL.md`, `verify.sh`, `AGENTS.md` |
| 3 | 루프는 실패 메시지에서 출발하고, 멈출 때를 안다 | '실패했을 때' 항목 |
| 4 | 스킬의 변경은 여러 과제로 평가해야 안다 | 평가 과제, 채점 스크립트 |
| 5 | 매번 지킬 검사는 훅으로, 최종 판정은 CI로 | `.codex/hooks.json` |
