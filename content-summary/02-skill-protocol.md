---
id: s-chapter-02
num: "02"
title: 스킬은 작업 프로토콜입니다
---

| 프로토콜의 요소 | 긴 프롬프트형 | 프로토콜형 |
|---|---|---|
| 트리거 | 언제 쓰는지 없음 | 적용 조건과 제외 조건을 `description`에 |
| 단계 | “꼼꼼히 확인하세요” | 화면 → 엔드포인트 확정 → 변경 → 호환성 → 검증 |
| 실패 처리 | 없음 | 호출 지점을 못 찾으면 멈추고 보고 |
| 완료 조건 | “테스트를 실행하세요” | 1에서 찾은 엔드포인트로 검증 통과 |

| 핵심 | 이유 |
|---|---|
| 트리거는 본문이 아니라 `description`에 쓴다 | Codex는 이름과 설명만 보고 스킬을 고르고, 본문은 그 뒤에 읽는다 |
| 상세 기준은 `references/`로 뺀다 | 본문은 매번 통째로 읽히므로 필요할 때만 읽을 자료는 분리한다 |
| 반복 실행은 `scripts/`로 고정한다 | 에이전트가 명령을 매번 조합하면 대상과 판정이 흔들린다 |
| 판단이 필요한 단계는 본문에 남긴다 | 스크립트는 결정적인 일에만. 어느 화면인지 찾는 일은 판단이다 |
| 저장소의 사실은 `AGENTS.md`, 판정은 CI | 스킬이 선택되지 않거나 단계를 건너뛰면 스킬 안의 검사도 빠진다 |

<div class="cards cols-4">
<div class="card"><span class="card-kicker">스킬 안</span><strong><code>SKILL.md</code></strong><span>판단이 필요한 절차</span></div>
<div class="card"><span class="card-kicker">스킬 안</span><strong><code>references/</code></strong><span>특정 단계의 기준</span></div>
<div class="card"><span class="card-kicker">스킬 안</span><strong><code>scripts/</code></strong><span>판단 없는 실행</span></div>
<div class="card"><span class="card-kicker">그 밖</span><strong><code>assets/</code>, <code>openai.yaml</code> <span class="badge codex">Codex 전용</span></strong><span>템플릿, 자동 선택 정책</span></div>
</div>

<div class="cards cols-2">
<div class="card warn"><span class="card-kicker">스킬이 맞지 않는 경우</span><strong>한 번만 할 일, 저장소의 사실, 기계적 판정</strong><span>각각 구체적인 요청, <code>AGENTS.md</code>, 테스트·린트가 맡는다</span></div>
<div class="card accent"><span class="card-kicker">스킬이 맞는 경우</span><strong>여러 작업에서 반복되는 판단과 순서</strong><span>이번 요청이 어느 화면에서 왔는지는 매번 새로 찾아야 한다</span></div>
</div>

<p class="see-also">→ <a href="./#chapter-02">본문 2장</a></p>
