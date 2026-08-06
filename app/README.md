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
npm run build
npm run build:real
```

## iOS

```bash
npm run ios:sync
```

서명 계정과 기기 정보는 Xcode의 로컬 설정으로만 관리한다. `xcuserdata`, 빌드된 웹 번들, provisioning profile은 Git 대상이 아니다.

## AI 입어보기 API

`ops/tryon-api`는 입력 이미지를 메모리에서만 처리한다. API 키는 `TRYON_API_KEY` 또는 read-only로 마운트한 `TRYON_API_KEY_FILE`에서 읽으며, 클라이언트 번들에 넣지 않는다. 로컬 예시는 `ops/docker-compose.yml`을 사용한다.
