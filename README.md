# 입핏 (Ipfit)

입핏은 옷 사진과 전신 사진으로 구매 전 착장을 확인하는 모바일 우선 AI 가상 피팅 앱이다. 이 저장소가 코드 정본이며, 현재 운영 사본과 실기기 데이터는 저장소 밖에서 관리한다.

## 빠른 시작

```bash
cd app
cp .env.example .env.local
npm ci
npm run dev
```

기본 검증은 다음과 같다.

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run build:real
```

## 구조

- `app/src`: React 앱과 도메인 로직
- `app/ios`: Capacitor iOS 프로젝트에서 재생성되지 않는 정본 파일
- `app/ops/tryon-api`: 이미지 생성 프록시
- `app/ops/docker-compose.yml`: 로컬 격리 실행 예시
- `docs`: 사용자 고지와 운영 계약

## 환경과 데이터

- `stage`: 사주 기능을 포함한 실험 환경
- `real`: AI 입어보기 중심 사용자 환경
- 사용자 사진·프로필·실행 trace는 Git에 저장하지 않는다.
- 광고 ID, 제휴 링크, 모델 API 키는 `.env.local` 또는 런타임 secret으로만 주입한다.

공개 저장소에는 라이선스 파일을 아직 두지 않았다. 소스 열람이 곧 재사용 허가를 뜻하지 않으며, 라이선스 정책은 별도 결정으로 확정한다.
