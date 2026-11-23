---
id: chapter-01
num: "01"
title: 코드를 만들었다는 사실과 잘 만들었다는 증거
---

에이전트의 최종 메시지는 작업의 요약이지 실행 결과가 아닙니다. 서론의 보고는 네 문장이었지만, 각 문장이 기대는 근거와 그 근거가 증명하는 범위는 모두 다릅니다. 이 장에서는 그 장면을 저장소 수준에서 다시 보고, 보고 속의 **증거와 증거처럼 보이는 주장**을 나눠 봅니다.

### 저장소에서 실제로 일어난 일

라우터에는 사용자 정보를 돌려주는 엔드포인트가 세 개 등록되어 있습니다. 셋 모두 같은 사용자 저장소를 읽습니다.

```ts src/routes.ts
router.get('/users/:id', usersController.getUser);
router.get('/api/v2/users/:id', usersV2.getUser);
router.get('/user/profile', profileController.getProfile);
```

<p class="keep-with-next">프로필 화면이 호출하는 것은 첫 번째입니다.</p>

```ts web/src/features/profile/api.ts
export function fetchUser(id: string) {
  return http.get<UserResponse>(`/users/${id}`);
}
```

<p class="keep-with-next">Codex의 변경은 두 번째 엔드포인트의 핸들러에 들어갔습니다. 변경 자체에는 흠이 없습니다.</p>

```diff src/api/v2/users.handler.ts
 export async function getUser(req: Request, res: Response) {
   const user = await userRepository.findById(req.params.id);
   res.json({
     id: user.id,
     name: user.name,
+    avatarUrl: user.avatarUrl ?? null,
   });
 }
```

<p class="keep-with-next">완료 확인도 같은 엔드포인트를 대상으로 이뤄졌습니다.</p>

```bash Codex의 확인 기록
$ pnpm test
 ✓ src/api/v2/users.handler.test.ts (4 tests)
 ✓ src/legacy/users.controller.test.ts (6 tests)
   …
 Test Files  18 passed (18)
      Tests  142 passed (142)

$ curl -s localhost:3000/api/v2/users/42 | jq .avatarUrl
"https://cdn.example.com/avatars/42.png"
```

<p class="keep-with-next">화면이 쓰는 엔드포인트에 같은 확인을 하면 결과가 다릅니다.</p>

```bash 프로필 화면이 쓰는 엔드포인트
$ curl -s localhost:3000/users/42 | jq 'has("avatarUrl")'
false
```

Codex는 이 명령을 실행하지 않았고, 나머지 확인은 모두 요구사항과 무관한 경로에 쌓였습니다.

<div aria-label="프로필 화면에서 GET /users/:id 를 거쳐 legacy 컨트롤러로 가는 요구사항 경로에는 변경이 없고, Codex가 검증한 GET /api/v2/users/:id 경로에만 필드가 추가되었다는 비교" class="path-figure" role="img">
<div class="path-row path-row--req">
<span class="path-label">요구사항이 가리키는 경로</span>
<div class="path-chain"><span class="path-node">프로필 화면</span><span class="path-arrow">→</span><span class="path-node"><code>GET /users/:id</code></span><span class="path-arrow">→</span><span class="path-node"><code>users.controller.ts</code></span></div>
<span class="badge fail">변경 없음</span>
</div>
<div class="path-row">
<span class="path-label">Codex가 고치고 검증한 경로</span>
<div class="path-chain"><span class="path-node">단위 테스트 · curl</span><span class="path-arrow">→</span><span class="path-node"><code>GET /api/v2/users/:id</code></span><span class="path-arrow">→</span><span class="path-node"><code>users.handler.ts</code></span></div>
<span class="badge pass">필드 있음</span>
</div>
<p class="diagram-note">두 경로는 같은 일을 하지만 만나지 않습니다. 아래 경로의 통과는 위 경로에 대해 아무것도 말해 주지 않습니다.</p>
</div>

<div class="page-break"></div>

### 대상을 바로잡아도 남는 문제

`GET /users/:id`를 제대로 고쳤다고 해도 검사 범위와 회귀는 별개의 문제로 남습니다.

<p class="keep-with-next"><strong>검사 범위.</strong> 컨트롤러에 필드를 추가해도, 그 값을 읽어 오는 쿼리가 따로 있다면 응답은 늘 <code>null</code>일 수 있습니다.</p>

```ts src/legacy/users.repository.ts
export async function findById(id: string): Promise<User> {
  const [row] = await db.query('SELECT id, name FROM users WHERE id = $1', [id]);
  return row as User;
}
```

<p class="keep-with-next">컨트롤러 테스트는 저장소를 목으로 바꿔 두었습니다.</p>

```ts src/legacy/users.controller.test.ts
vi.spyOn(userRepository, 'findById').mockResolvedValue({
  id: '42',
  name: 'Kim',
  avatarUrl: 'https://cdn.example.com/avatars/42.png',
});
```

목이 `avatarUrl`을 돌려주므로 테스트는 통과하고, `as User` 캐스팅 때문에 타입 검사도 통과합니다. 하지만 실제 쿼리는 `avatar_url` 컬럼을 읽지 않으므로, 서버를 띄워 호출하면 모든 사용자의 `avatarUrl`이 `null`입니다. 테스트가 확인한 것은 목이 돌려준 값까지입니다.

<p class="keep-with-next"><strong>회귀.</strong> 필드를 추가하는 김에 응답 매핑을 정리하고, 그에 맞춰 기존 테스트의 기대값까지 고치면 테스트는 그대로 통과합니다.</p>

```diff src/legacy/users.controller.ts
   res.json({
     id: user.id,
-    name: user.name,
+    displayName: user.name,
+    avatarUrl: user.avatarUrl ?? null,
   });
```

```diff src/legacy/users.controller.test.ts
-  expect(body.name).toBe('Kim');
+  expect(body.displayName).toBe('Kim');
```

> [!주의]
> 테스트를 코드에 맞춰 고친 순간 그 테스트는 회귀 기준의 역할을 잃습니다. 통과하는 테스트가 아니라 고치기 전의 기대값이 기준입니다.

### 작업 품질과 품질의 증거

그래서 **작업 품질**과 **품질의 증거**는 나눠서 다뤄야 합니다. 앞의 것은 요구사항 충족이나 호환성 같은 결과물의 속성이고, 뒤의 것은 테스트 로그, 계약 검사, 실행 기록처럼 관찰 가능한 자료입니다.

품질은 다시 **Correctness**(요구사항 충족), **Regression Safety**(기존 기능 보존), **Process Consistency**(정해진 절차 준수), **Verifiability**(제3자의 재확인 가능성), **Cost**(지불한 비용)로 나눌 수 있습니다. 서론의 사례를 이 기준으로 판정하면 다음과 같습니다.

| 차원 | 묻는 것 | 남은 증거 | 판정 |
|---|---|---|---|
| Correctness | 프로필 화면에 이미지가 보이는가 | 없음. v2 응답만 확인했다 | <span class="badge fail">실패</span> |
| Regression Safety | 기존 기능이 유지되는가 | 142개 테스트 통과 | <span class="badge pass">통과</span> |
| Process Consistency | 정해진 절차를 따랐는가 | 따를 절차가 정해져 있지 않았다 | <span class="badge na">판정 불가</span> |
| Verifiability | 제3자가 결과를 다시 확인할 수 있는가 | 테스트 로그, `curl` 기록 | <span class="badge pass">통과</span> |
| Cost | 무엇을 지불했는가 | 작업 몇 분, 다음 날의 원인 추적 | <span class="badge warn">숨은 비용</span> |

증거가 가장 잘 남은 Verifiability는 통과인데 Correctness는 실패입니다. **증거가 있다는 것과 그 증거가 요구사항을 증명한다는 것은 다른 문제입니다.**

<p class="keep-with-next">요구사항이 가리키는 대상을 기준으로 증거를 갖춘 완료 보고는 다음과 같습니다.</p>

```text 증거가 붙은 완료 보고
변경 대상
  GET /users/:id (web/src/features/profile/api.ts의 fetchUser가 호출)
  src/legacy/users.controller.ts 수정

같은 역할의 엔드포인트 (변경하지 않음)
  GET /api/v2/users/:id, GET /user/profile: 프런트엔드에서 호출하지 않음

검증
  pnpm test                         144 passed
  curl /users/42 | jq .avatarUrl    "https://cdn.example.com/avatars/42.png"
  curl /users/7  | jq .avatarUrl    null (이미지가 없는 사용자)

확인하지 못한 것
  관리자 페이지 등 다른 클라이언트의 호출 여부
```

'확인하지 못한 것'은 실패의 고백이 아니라 검증 범위의 명시입니다. 이 항목이 있어야 리뷰어가 어디부터 의심해야 하는지 알 수 있습니다.

### 매번 확인하게 만들려면

요청마다 “꼼꼼히 확인해 줘”를 덧붙이는 것으로는 대상, 검사 범위, 회귀를 매번 확인하게 만들 수 없습니다. 서론의 Codex에게 부족했던 것은 성실함이 아니라 대상을 정하는 기준과 확인 순서였습니다.

이 사례라면 그 기준과 순서는 세 줄로 적을 수 있습니다. 변경을 요청한 화면에서 출발해 실제로 호출되는 엔드포인트를 찾는다. 같은 역할의 엔드포인트가 더 있는지 확인한다. 완료 확인은 처음 찾은 엔드포인트로 한다. 이런 절차를 작업 단위로 남겨 에이전트가 매번 같은 순서로 밟게 하는 장치가 2장에서 다룰 스킬입니다.
