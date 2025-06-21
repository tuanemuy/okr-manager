# データフェッチ戦略の改善

## 背景

- `CLAUDE.md` にガイダンスを記載した
- `docs/requirements.md` に要件を定義した
- ページコンポーネントのトップレベルでデータフェッチを行っているため、First Contentful Paint (FCP) が遅い

## タスク

- Server Components を利用して、コンポーネントごとに非同期でデータフェッチを行う
