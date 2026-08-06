# 입핏 앱

React 19, TypeScript, Vite, Capacitor 기반의 모바일 우선 앱이다. `VITE_APP_ENV=real`이면 사주 화면을 숨기고 AI 입어보기 흐름에 집중한다.

## 개발

```bash
cp .env.example .env.local
npm ci
npm run dev
```

## 검증

```bash
npm run typecheck
npm test
npm run lint

# 자동 main 반영·운영 배포 가능 상태는 위 고정 검사 통과 외에 독립 CODE·SECURITY·QA 승인 영수증이 별도로 있어야 판단할 수 있다.
npm run build
npm run build:real
```

## iOS

```bash
npm run ios:sync
```

서명 계정과 기기 정보는 Xcode의 로컬 설정으로만 관리한다. `xcuserdata`, 빌드된 웹 번들, provisioning profile은 Git 대상이 아니다.

## AI 입어보기 API

`VITE_TRYON_API_URL`은 호스트만 주거나 이미 `/__tryon`을 포함해도 된다. 앱은 최종 호출 경로를 항상 단일 `/__tryon` 엔드포인트로 정규화한다.

`ops/tryon-api`는 입력 이미지를 메모리에서만 처리한다. API 키는 `TRYON_API_KEY` 또는 read-only로 마운트한 `TRYON_API_KEY_FILE`에서 읽으며, 클라이언트 번들에 넣지 않는다. 로컬 예시는 `ops/docker-compose.yml`을 사용한다.

운영 입력 경계는 다음과 같다.

- 요청 본문은 스트리밍 수신 중 22 MiB를 넘는 즉시 `413`으로 종료한다.
- `person`과 `garments`는 엄격한 base64 JPEG만 허용하며, 디코딩한 각 이미지는 최대 5 MiB다.
- 옷 이미지는 1~2장만 허용한다.
- 형식 오류는 `400`, 크기 초과는 `413`으로 끝내고 이미지 생성 upstream을 호출하지 않는다.

정상 입력, 잘못된 JSON/base64/JPEG/개수, 본문·이미지 크기 경계는 `ops/tryon-api/server.test.mjs`에서 회귀 검증한다.
