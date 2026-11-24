---
id: s-chapter-05
num: "05"
title: 훅으로 검증을 묶습니다
---

<div class="cards">
<div class="card"><span class="card-kicker">스킬</span><strong>부탁</strong><span>선택되고 제대로 읽혀야 작동한다. 평가로 비율을 높일 뿐</span></div>
<div class="card accent"><span class="card-kicker">훅</span><strong>강제</strong><span>정해진 시점마다 항상 실행된다. 스킬과 상관없이</span></div>
<div class="card"><span class="card-kicker">CI</span><strong>최종 판정</strong><span>에이전트와 상관없이, 병합 전에</span></div>
</div>

| 훅의 구성 | 내용 |
|---|---|
| 이벤트 | `PreToolUse`(도구 실행 전), `Stop`(턴 종료 전) 등 |
| 매처 | 어떤 도구에 반응할지. 예: `^apply_patch$` |
| 결과 | 막기(`deny`) 또는 이어 가기(`block` + 이유가 다음 프롬프트) |
| 설정 | 프로젝트의 `.codex/hooks.json`. 신뢰한 프로젝트에서만 실행 |

| 훅 | 언제 | 무엇을 | 막는 실수 |
|---|---|---|---|
| 레거시 수정 차단 | 파일 수정 직전 | 레거시 엔드포인트 수정을 막고 정식 엔드포인트를 알려 준다 | 서론처럼 v2를 고치기 |
| 종료 전 검증 | 턴 종료 직전 | 계약 테스트 실패 시 실패 내용으로 작업을 이어 가게 한다 | 검증 없이 완료 보고 |

<div class="cards cols-2">
<div class="card accent"><span class="card-kicker">원칙</span><strong>판단은 스킬에, 매번 지킬 것은 훅에</strong><span>어느 화면인지 찾는 일은 스크립트로 정할 수 없다</span></div>
<div class="card warn"><span class="card-kicker">한계</span><strong>훅은 안전장치, 강제 경계가 아니다</strong><span>가로채지 못하는 도구가 있다. 최종 판정은 CI에</span></div>
</div>

<p class="see-also">→ <a href="./#chapter-05">본문 5장</a></p>
