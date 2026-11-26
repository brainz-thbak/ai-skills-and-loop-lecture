---
title: 스킬 설계와 평가 상세 가이드
document_type: guide
description: >-
  AI 에이전트가 저장소에 맞는 SKILL.md와 작업 중 검증 루프를 설계하고,
  독립적인 평가 과제, 실행기, 채점기, 재평가 절차를 만드는 데 쓰는 상세 가이드.
language: ko
source:
  title: 스킬과 피드백 루프로 품질 높이기
  url: https://brainz-thbak.github.io/ai-skills-and-loop-lecture/
  chapters: [2, 3, 4]
---

# 스킬 설계와 평가 상세 가이드

개발 작업을 반복해서 맡길 스킬을 작성한다. 스킬은 작업 중 검증 실패를 처리한다. 평가 실행기와 채점기는 별도의 과제로 그 스킬의 효과를 측정한다.

이 가이드를 AI에 줄 때는 작업 대상 저장소, 반복해서 들어오는 요청, 기존 검증 명령을 함께 제공한다. AI에게 아래 산출물을 요청한다.

- 프로젝트에 맞춘 `SKILL.md`와 필요한 참조 문서 또는 검증 스크립트.
- 평가 과제 목록과 고정된 초기 저장소 상태. 스킬이 발동해야 하는 요청, 발동하지 않아야 하는 요청, 중단이 정답인 요청을 포함한다.
- 실행 기록을 남기는 실행기, 프로젝트별 독립 검사, 채점기와 비교 절차.

명령과 경로는 대상 저장소에서 확인한다. 확인되지 않은 전제는 무엇을 확인해야 하는지 적는다. 이 가이드의 API와 저장소 상태는 설계 예시다.

## 1. 스킬을 작성한다

먼저 실제 요청과 그 결과를 관찰할 위치를 찾는다. 예를 들어 프로필 화면의 이미지 표시가 목표라면 화면의 요청 코드에서 엔드포인트를 확인한다. 이름이 비슷한 엔드포인트가 여럿이면 화면이 호출하는 경로를 스킬의 변경 대상과 검증 대상으로 정한다.

`description`에는 사용자 요청을 기준으로 발동 범위를 적는다. `SKILL.md` 본문에는 입력, 대상 확인 방법, 변경 단계, 실패 시 행동, 완료 조건을 적는다. 특정 단계에서 필요한 호환성 기준은 `references/`에 두고, 저장소의 검증 명령을 반복 실행할 때는 필요한 경우 `scripts/`로 묶는다.

다음은 `api-response-change/SKILL.md`의 예시다.

```markdown
---
name: api-response-change
description: >-
  기존 API 응답 필드의 추가, 변경, 삭제를 요청받을 때 사용한다.
  응답을 유지하는 리팩터링이나 문서 수정에는 사용하지 않는다.
---

# API 응답 변경

## 입력

- 요청한 화면 또는 클라이언트, 변경할 필드, 기대하는 값이나 타입.

## 절차

1. 클라이언트 코드에서 실제 호출 경로를 확인한다. 호출 지점이 불명확하면 필요한 정보를 보고하고 멈춘다.
2. 기존 필드의 호환성에 영향을 주는 요청이면 `references/compatibility.md`의 판정에 따른다.
3. 값의 출처부터 응답까지 확인하고 필요한 코드를 수정한다.
4. 기존 계약 테스트와 실제 호출 경로의 응답을 확인한다. 이 예시에서는 `scripts/verify.sh`에 호출 경로와 요청 필드를 전달한다.

## 검증에 실패하면

1. 타입 검사, 테스트, 실제 응답 확인 중에서 실패한 단계를 구분한다.
2. 실패 근거로 원인을 확인하고, 확인한 부분만 수정한 뒤 같은 검사를 실행한다.
3. 기존 필드의 계약을 바꿔야 하거나, 원인을 확인할 수 없거나, 수정 뒤 같은 실패가 반복되면 멈추고 보고한다.

## 완료 조건

- 실제 호출 경로의 응답이 요구사항을 충족하고 기존 계약 테스트가 통과한다.
- 변경 대상, 검증 명령과 결과, 아직 확인하지 못한 범위를 보고한다.
```

예시의 `references/compatibility.md`에는 기존 `name`을 제거하거나 이름을 바꾸는 요청에는 기존 계약을 유지한다고 적는다. 새 필드 추가가 허용되는 프로젝트에서는 새 필드에 대한 기대값을 추가할 수 있다. 두 판단을 별도로 적어 새 필드 추가 과제가 호환성 규칙 때문에 멈추는 경우를 줄인다.

## 2. 작업 중 검증 루프를 설계한다

검증을 실행하기 전에 목표, 관찰할 결과, 실패 신호, 수정 범위, 종료 조건을 정한다.

| 항목 | `avatarUrl` 추가 예시 |
| --- | --- |
| 목표 | 프로필 화면이 호출하는 `GET /users/:id` 응답에 저장된 `avatarUrl`이 포함된다. |
| 관찰할 결과 | 타입 검사, 계약 테스트, 시드 데이터가 있는 실제 서버 응답. |
| 실패 신호 | 타입 검사와 테스트는 통과하지만 실제 응답의 `avatarUrl`이 `null`이다. |
| 수정 범위 | 응답 조립 코드와 조회 쿼리를 확인한다. 실제 호출 경로와 기존 필드 계약을 유지한다. |
| 종료 조건 | 같은 검사에서 통과하면 완료한다. 원인을 확인할 수 없거나 같은 실패가 반복되거나 정해 둔 시도 한도에 도달하면 멈춘다. |

이 예시에서는 먼저 API 응답과 조회 결과를 비교한다. 쿼리가 `avatarUrl`을 선택하지 않는다는 사실을 확인하면 쿼리를 수정하고 같은 사용자와 경로로 재검증한다. 실제 테스트 데이터를 쓸 수 없으면, 검사하지 못한 부분과 재현에 필요한 조건을 보고한다.

## 3. 평가 과제와 독립 검사를 고정한다

과제마다 프롬프트, 저장소 상태, 기대 발동 여부, 기대 행동을 먼저 정한다. 저장소 상태는 고정된 Git 태그 또는 커밋으로 가리킨다. 태그가 가리키는 커밋을 평가 시작 전에 확인하고, 한 쌍의 비교가 끝날 때까지 유지한다.

다음 내용을 평가 대상 저장소의 `evals/cases.csv`로 저장한다. `tuning` 과제는 스킬을 점검하고 수정하는 데 쓴다. `holdout` 과제는 후보가 정해진 뒤에 실행한다.

```csv
id,split,should_trigger,expected,fixture_ref,prompt
add-login,tuning,true,complete,fixtures/single-endpoint,"설정 화면에서 쓸 lastLoginAt을 사용자 조회 응답에 추가해 줘."
choose-route,tuning,true,complete,fixtures/duplicate-endpoints,"프로필 화면에 이미지가 보이도록 사용자 조회 API에 avatarUrl을 추가해 줘."
select-field,tuning,true,complete,fixtures/missing-column,"프로필 화면에 이미지가 보이도록 사용자 조회 API에 avatarUrl을 추가해 줘."
protect-name,tuning,true,stop,fixtures/single-endpoint,"기존 사용자 조회 응답의 name을 displayName으로 바꿔 줘."
fix-readme,tuning,false,complete,fixtures/single-endpoint,"README의 제일 위 제목에 있는 오탈자를 고쳐 줘."
add-order-field,holdout,true,complete,fixtures/orders,"주문 화면에서 배송 예정일이 보이게 주문 조회 응답에 estimatedDeliveryAt을 추가해 줘."
refactor-order,holdout,false,complete,fixtures/orders,"주문 조회 컨트롤러의 중복 코드를 함수로 추출해 줘. 응답은 유지해 줘."
```

각 초기 상태를 준비하고 응답의 정답을 고정할 시드 데이터를 둔다. 기준과 후보에서 동일한 검사 코드를 사용한다. `evals/checks/<과제 ID>.sh`는 작업 경로와 최종 응답 파일 경로를 인자로 받는다. 에이전트는 임시 작업 트리에서 실행한다. 평가용 복제본에 둔 검사 스크립트로 임시 작업 트리를 검사한다.

| 과제 | 독립 검사가 확인할 항목 |
| --- | --- |
| `add-login` | 시드 사용자의 `lastLoginAt` 값이 기대값과 같고 기존 필드가 유지된다. |
| `choose-route` | 화면이 호출하는 정식 엔드포인트에 `avatarUrl`이 있고, 레거시 경로의 응답과 구현이 유지된다. |
| `select-field` | 목으로 대체하지 않은 저장소에서 읽은 `avatarUrl`이 실제 응답에 담긴다. |
| `protect-name` | 대상 코드와 계약에 변경이 없고, 최종 응답에 호환성 때문에 중단했다고 보고한다. |
| `fix-readme` | 제목 오탈자가 사라지고 변경 범위가 README로 제한된다. |
| `add-order-field` | 시드 주문의 `estimatedDeliveryAt` 값이 기대값과 같고 기존 계약이 유지된다. |
| `refactor-order` | 지정한 중복 코드가 추출되고 기존 응답 계약이 유지된다. |

검사기는 요구사항 충족 시 `0`, 결과 불일치 시 `1`, 실행 환경 문제 시 `2` 이상을 반환한다. 테스트 서버가 시작되지 않거나 시드 데이터가 없다면 실행 환경 문제로 기록한다. 실제 API를 검사하는 과제에서는 평가용 데이터와 로컬 서버를 사용한다. 검사를 준비할 때 이미 통과하는 결과와 의도적으로 틀린 결과에 모두 실행해 판정이 바뀌는지 확인한다.

다음은 `evals/checks/fix-readme.sh`의 예시다. 첫 줄이 `# Uesr API`인 초기 상태에서 `# User API`로 고쳤는지 확인한다. 다른 파일의 수정과 새 파일 추가도 확인한다. 실행기가 설치한 평가 대상 스킬의 경로는 변경 목록에서 제외한다. 스킬 파일 자체의 변경을 금지하려면 설치 직후와 실행 종료 후의 파일을 별도로 비교한다.

```bash
# evals/checks/fix-readme.sh
set -u
work="$1"
if [[ ! -f "$work/README.md" ]]; then
	echo "README.md is missing"
	exit 1
fi
heading=$(head -n 1 "$work/README.md") || exit 2
changed=$(git -C "$work" status --porcelain=v1 --untracked-files=all -- \
	. ':(exclude).agents/skills/api-response-change') || exit 2
[[ "$heading" == '# User API' && "$changed" =~ ^[[:space:]M][[:space:]M]' README.md'$ ]] || exit 1
```

## 4. 기준과 후보를 같은 조건에서 실행한다

평가 전용 저장소 복제본, Git, Python 3.9 이상과 실제로 사용할 모델에 접근할 수 있는 Codex CLI를 준비한다. 아래 `evals/run.py`는 새 임시 Git 작업 트리에 과제와 스킬을 배치한 뒤 실행 기록, 최종 응답, 독립 검사 결과를 작업 트리 밖에 남긴다. 각 검사 파일은 프로젝트 명령으로 작성한다. 실행과 검사에 같은 의존성과 초기 데이터가 준비되도록 설정한다.

- 초기 도입을 평가할 때는 `evals/skills/baseline/`을 두지 않는다. 기존 스킬을 바꿀 때는 기준 스킬을 그 경로에 둔다. 후보 스킬은 `evals/skills/candidate/`에 둔다.
- 초기 상태의 `.agents/skills/`와 평가 계정의 사용자 설정, 전역 스킬, 플러그인을 확인한다. 평가 대상의 다른 복사본이 로드되면 기준과 후보가 섞인다.
- 같은 모델, CLI 버전, 설정, 초기 상태, 과제, 반복 횟수와 검사기를 사용한다. 개인 설정에 따라 달라지는 평가 동작도 양쪽에서 동일하게 맞춘다.
- 다른 스킬에 적용할 때는 설치 경로의 `api-response-change`와 채점기의 스킬 고유 파일 이름을 대상 스킬에 맞춘다.

```python
# evals/run.py
import argparse
import csv
import json
import re
import shutil
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory


def run_logged(command, cwd, stdout_path, stderr_path, timeout):
	with stdout_path.open("wb") as stdout, stderr_path.open("wb") as stderr:
		try:
			return subprocess.run(
				command, cwd=cwd, stdout=stdout, stderr=stderr,
				stdin=subprocess.DEVNULL, timeout=timeout, check=False,
			).returncode
		except subprocess.TimeoutExpired:
			return None


parser = argparse.ArgumentParser()
parser.add_argument("variant", choices=["baseline", "candidate"])
parser.add_argument("split", choices=["tuning", "holdout"])
parser.add_argument("--model", required=True)
parser.add_argument("--repeat", type=int, required=True)
parser.add_argument("--out", type=Path, required=True)
args = parser.parse_args()
if args.repeat < 1:
	parser.error("--repeat must be at least 1")

repo = Path.cwd()
evals = repo / "evals"
out = args.out.resolve()
skill = evals / "skills" / args.variant
if (args.variant == "candidate" or skill.exists()) and not (skill / "SKILL.md").is_file():
	parser.error(f"SKILL.md is missing in {skill}")

with (evals / "cases.csv").open(encoding="utf-8", newline="") as file:
	cases = [case for case in csv.DictReader(file) if case["split"] == args.split]

ids = [case["id"] for case in cases]
if not ids or len(set(ids)) != len(ids) or any(not re.fullmatch(r"[a-z0-9][a-z0-9-]*", case_id) for case_id in ids):
	parser.error("each split needs at least one case and unique slug IDs")

for case in cases:
	case["checker"] = evals / "checks" / (case["id"] + ".sh")
	if not case["checker"].is_file():
		parser.error(f"checker is missing: {case['checker']}")
	case["fixture_commit"] = subprocess.check_output(
		["git", "rev-parse", "--verify", "--end-of-options", case["fixture_ref"] + "^{commit}"],
		cwd=repo, text=True,
	).strip()

codex_version = subprocess.check_output(["codex", "--version"], text=True).strip()
out.mkdir(parents=True, exist_ok=False)
for case in cases:
	for attempt in range(1, args.repeat + 1):
		result_dir = out / case["id"] / str(attempt)
		result_dir.mkdir(parents=True)
		with TemporaryDirectory(prefix="skill-eval-") as temp:
			work = Path(temp) / "checkout"
			subprocess.run(["git", "worktree", "add", "--detach", str(work), case["fixture_commit"]], cwd=repo, check=True)
			try:
				installed = work / ".agents" / "skills" / "api-response-change"
				if installed.exists():
					raise RuntimeError(f"fixture already contains the tested skill: {case['id']}")
				if skill.is_dir():
					shutil.copytree(skill, installed)
				answer = result_dir / "answer.txt"
				agent_exit = run_logged(
					["codex", "exec", "--json", "--ephemeral", "--sandbox", "workspace-write",
					 "--model", args.model, "--output-last-message", str(answer), "--", case["prompt"]],
					work, result_dir / "trace.jsonl", result_dir / "agent.stderr", 900,
				)
				check_exit = None
				if agent_exit == 0 and answer.is_file():
					check_exit = run_logged(
						["bash", str(case["checker"]), str(work), str(answer)],
						repo, result_dir / "check.log", result_dir / "check.stderr", 120,
					)
				summary = {
					"case": case["id"], "variant": args.variant, "split": args.split, "attempt": attempt,
					"fixture_commit": case["fixture_commit"], "model": args.model, "codex": codex_version,
					"should_trigger": case["should_trigger"] == "true", "expected": case["expected"],
					"agent_exit": agent_exit, "check_exit": check_exit,
				}
				(result_dir / "result.json").write_text(json.dumps(summary) + "\n", encoding="utf-8")
			finally:
				subprocess.run(["git", "worktree", "remove", "--force", str(work)], cwd=repo, check=True)
```

`EVAL_MODEL`에 평가할 모델을 정한 뒤 저장소 루트에서 실행한다. 스모크 테스트에서는 `--repeat 1`로 경로와 판정을 확인한 후 본 평가의 반복 수를 정한다. 아래의 `5`는 예시다. 결과 경로는 각 평가마다 새로 지정한다.

```sh
python3 evals/run.py baseline tuning --model "$EVAL_MODEL" --repeat 5 --out evals/runs/tuning-a
python3 evals/run.py candidate tuning --model "$EVAL_MODEL" --repeat 5 --out evals/runs/tuning-b
```

[OpenAI의 스킬 평가 실행 예제](https://developers.openai.com/blog/eval-skills)

## 5. 결과를 채점하고 후보를 비교한다

| 축 | 판정 근거 |
| --- | --- |
| Outcome | 독립 검사로 실제 응답, 기존 계약, 변경 범위를 확인한다. 중단이 정답인 과제에서는 계약과 최종 응답의 중단 사유를 함께 확인한다. |
| Process | 실행 기록에서 요구된 절차를 확인한다. 완료 과제는 실제 호출 경로를 검증했는지 본다. 중단 과제는 대상 확인과 중단 판단에 필요한 근거를 수집했는지 본다. |
| Invocation | 스킬 발동 여부를 기록한 이벤트가 있으면 기대값과 대조한다. 직접 관찰이 어려우면 스킬 고유 파일을 쓴 흔적을 근거로 남기고, 판정할 근거가 부족한 실행은 미확인으로 둔다. |
| Efficiency | 완료한 실행끼리 토큰과 명령 횟수를 비교한다. 중단과 실행 오류의 비용은 별도로 본다. |

예를 들어 아래 실행 기록에는 `/users/42`를 인자로 받은 검증 명령과 토큰 사용량이 있다. 이 기록과 별개로 검사기는 시드 사용자의 실제 응답을 확인한다.

```jsonl
{"type":"item.completed","item":{"type":"command_execution","command":"bash .agents/skills/api-response-change/scripts/verify.sh /users/42 avatarUrl","exit_code":0}}
{"type":"turn.completed","usage":{"input_tokens":8600,"output_tokens":420}}
```

아래 `evals/grade.py`는 독립 검사 결과와 실행 기록을 JSONL로 요약한다. 출력의 `skill_verify_passed`와 `skill_file_signal`은 기록에서 찾은 **신호**다. 성공한 명령에 실제 호출 경로가 들어 있는지, 중단 과제에서 호환성 기준을 확인했는지 등은 과제별 규칙으로 확인한다. 스킬 고유 파일이 기록에 없으면 `skill_file_signal`은 `unobserved`다. 스킬을 발동하지 않았다고 판정하려면 발동 여부를 직접 관찰할 수 있는 근거가 필요하다.

```python
# evals/grade.py
import argparse
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("runs", nargs="+", type=Path)
args = parser.parse_args()

for root in args.runs:
	results = sorted(root.glob("*/*/result.json"))
	if not results:
		parser.error(f"no runs in {root}")
	for result in results:
		summary = json.loads(result.read_text(encoding="utf-8"))
		trace = result.with_name("trace.jsonl")
		try:
			events = [json.loads(line) for line in trace.read_text(encoding="utf-8").splitlines() if line.strip()]
		except (OSError, ValueError):
			events = []
		commands = [event["item"] for event in events if event.get("type") == "item.completed"
		            and isinstance(event.get("item"), dict) and event["item"].get("type") == "command_execution"]
		usage = [event.get("usage", {}) for event in events if event.get("type") == "turn.completed"]
		complete_trace = summary["agent_exit"] == 0 and bool(usage)
		check_exit = summary["check_exit"]
		outcome = {0: "pass", 1: "fail"}.get(check_exit, "run-error") if complete_trace else "run-error"
		verify = [command for command in commands if "scripts/verify.sh" in command.get("command", "")]
		skill_signal = any(
			"api-response-change/" in command.get("command", "")
			and any(path in command.get("command", "") for path in ("scripts/verify.sh", "references/compatibility.md"))
			for command in commands
		)
		summary.update(
			outcome=outcome,
			skill_verify_passed=verify[-1].get("exit_code") == 0 if verify else None,
			skill_file_signal="observed" if skill_signal else "unobserved",
			commands=len(commands),
			tokens=sum(turn.get("input_tokens", 0) + turn.get("output_tokens", 0) for turn in usage) if usage else None,
		)
		print(json.dumps(summary, ensure_ascii=False))
```

```sh
python3 evals/grade.py evals/runs/tuning-a evals/runs/tuning-b
```

비교 전에 `(과제 ID, 초기 커밋, 모델, CLI 버전, 반복 횟수)`가 일치하는지 확인한다. 과제별로 통과 수와 전체 실행 수를 함께 보고하고 `run-error`와 발동 미확인을 명시한다. 한 조건에서 실행 오류가 반복되면 환경을 진단하고 동일한 조건에서 다시 실행한다. 기대했던 과제나 반복 기록이 빠졌으면 비교를 보류한다.

## 6. 근거가 있는 규칙을 고치고 재평가한다

1. 과제별 차이에서 반복되는 실패를 고른다. 예를 들어 `add-login`이 기존 응답에 필드를 추가하기 전에 멈췄다면, `answer.txt`, `trace.jsonl`과 독립 검사 결과에서 중단 이유를 확인한다.
2. 그 판단을 유발한 지침을 수정한다. 이 예시에서는 기존 필드의 계약을 보존한다는 조건과, 새 필드의 기대값을 추가할 수 있다는 조건을 구체화한다.
3. 같은 `tuning` 과제로 기준과 수정 후보를 다시 비교한다. `add-login`의 통과와 `protect-name`의 중단 동작을 함께 확인한다. `fix-readme`에서 스킬 발동 증거도 살핀다.
4. 후보가 정해지면 `holdout`에서 기준과 후보를 각각 실행한다. 동일한 CLI 명령에서 `tuning`을 `holdout`으로 바꾸고 새 `--out` 경로를 쓴다. 결과에 맞춰 후보를 다시 고친다면 그 과제를 튜닝에 사용한 것으로 기록하고 다른 보류 과제로 확인한다.
5. 평가 전에 정한 채택 기준과 반복 예산으로 종료한다. 예를 들어 목표 과제에서 통과가 늘고, 기존 계약 보호 과제에서 회귀가 없으며, 보류 과제에서도 같은 경향이 확인되면 후보를 채택한다. 실행 간 차이가 크거나 증거가 부족하면 반복 예산 안에서 확인하고, 근거가 부족한 채로 종료하면 그 이유를 보고한다.

## 강의에서 설계 근거를 확인한다

- [강의 2장 · 스킬 설계](https://brainz-thbak.github.io/ai-skills-and-loop-lecture/#chapter-02)
- [강의 3장 · 작업 중 피드백 루프](https://brainz-thbak.github.io/ai-skills-and-loop-lecture/#chapter-03)
- [강의 4장 · 스킬 평가](https://brainz-thbak.github.io/ai-skills-and-loop-lecture/#chapter-04)
