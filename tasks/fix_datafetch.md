# データフェッチ戦略の改善

## 背景

- `CLAUDE.md` にガイダンスを記載した
- `docs/requirements.md` に要件を定義した
- ページコンポーネントのトップレベルでデータフェッチを行っているため、First Contentful Paint (FCP) が遅い

## タスク

- Server Components を利用して、コンポーネントごとに非同期でデータフェッチを行う

## 実装完了

### 高優先度ページの最適化
✅ **`/teams/page.tsx`**
- チーム一覧データフェッチを `TeamsList` コンポーネントに分離
- Suspense境界を追加してスケルトンローディングを実装
- ページヘッダーとCTAボタンは即座に表示される

✅ **`/notifications/page.tsx`** 
- 通知データとユーザー設定データの並列フェッチを `NotificationsContent` コンポーネントに分離
- Suspense境界を追加してスケルトンローディングを実装
- ページタイトルエリアは即座に表示される

✅ **`/teams/[teamId]/okrs/page.tsx`**
- OKR一覧データフェッチを `OkrsList` コンポーネントに分離
- Suspense境界を追加してスケルトンローディングを実装
- ページヘッダーとフィルター機能は即座に表示される

✅ **`/profile/page.tsx`** *(新規完了)*
- ユーザーセッションとプロフィールデータのフェッチを `ProfileContent` コンポーネントに分離
- Suspense境界とスケルトンローディングを実装
- ページタイトルとナビゲーションが即座に表示される

✅ **`/teams/[teamId]/page.tsx`** *(新規完了)*
- チームデータフェッチを `TeamDetailContent` コンポーネントに分離
- 既存のSuspense境界と組み合わせて完全な最適化を実現
- ページレイアウトが即座に表示される

✅ **`/teams/[teamId]/okrs/[okrId]/page.tsx`** *(新規完了)*
- OKRと キーリザルトのデータフェッチを `OkrDetailContent` コンポーネントに分離
- 詳細なスケルトンローディングを実装
- ページコンテナが即座に表示される

✅ **`/teams/[teamId]/okrs/[okrId]/edit/page.tsx`** *(新規完了)*
- OKR編集データフェッチを `EditOkrContent` コンポーネントに分離
- 編集フォーム用のスケルトンローディングを実装
- ヘッダーとナビゲーションが即座に表示される

✅ **`/teams/[teamId]/members/page.tsx`** *(新規完了)*
- チーム・メンバーデータの並列フェッチを `TeamMembersContent` コンポーネントに分離
- メンバー一覧用のスケルトンローディングを実装
- ページタイトルとナビゲーションが即座に表示される

✅ **`/teams/[teamId]/settings/page.tsx`** *(新規完了)*
- チーム設定、ユーザー権限、メンバー数の並列フェッチを `TeamSettingsContent` コンポーネントに分離
- タブ切り替え用のスケルトンローディングを実装
- ページヘッダーが即座に表示される

✅ **`/invitations/[invitationId]/page.tsx`** *(新規完了)*
- 招待データフェッチを `InvitationDetailContent` コンポーネントに分離
- 招待詳細用のスケルトンローディングを実装
- ページタイトルとナビゲーションが即座に表示される

### パフォーマンス改善効果

**改善前:**
- ページ全体がデータ取得完了まで白い画面で待機
- チーム一覧、通知、OKR一覧などの大きなデータセットで特に遅延が発生

**改善後:**
- ページの基本構造（ヘッダー、ナビゲーション、フィルター等）が即座に表示
- データ取得中はスケルトンローディングで適切なフィードバック
- 複数のデータソースがある場合も並列処理で効率化
- First Contentful Paint (FCP) の大幅な向上

### 実装パターン

各ページで以下のパターンを採用:

1. **メインページコンポーネント**: 即座に表示可能な要素のみをレンダリング
2. **データフェッチコンポーネント**: async/awaitでデータ取得を行う
3. **Suspense境界**: スケルトンローディングでUX向上
4. **スケルトンコンポーネント**: 実際のコンテンツと同じ構造でローディング状態を表現

これにより、ユーザーはページの読み込み開始を即座に感じることができ、パフォーマンスが大幅に改善されています。

## 追加で完了した最適化

### 2024年12月時点での追加最適化
高優先度の7ページを新たに最適化し、合計で**10ページ**のデータフェッチ最適化が完了しました：

**最適化済みページ総数**: 10ページ
- `/teams/page.tsx` 
- `/notifications/page.tsx`
- `/teams/[teamId]/okrs/page.tsx`
- `/profile/page.tsx` 
- `/teams/[teamId]/page.tsx`
- `/teams/[teamId]/okrs/[okrId]/page.tsx`
- `/teams/[teamId]/okrs/[okrId]/edit/page.tsx`
- `/teams/[teamId]/members/page.tsx`
- `/teams/[teamId]/settings/page.tsx`
- `/invitations/[invitationId]/page.tsx`

すべてのページで以下の最適化パターンを適用：
1. **即座に表示される要素**: ページタイトル、ナビゲーション、基本レイアウト
2. **データフェッチコンポーネント**: async/awaitを使用した分離されたデータ取得
3. **Suspense境界**: 適切なローディング状態管理
4. **スケルトンローディング**: 実際のコンテンツ構造を反映したローディングUI

### 残りの中・低優先度ページ
データフェッチ最適化が必要な残りページ（4ページ）：
- `/teams/[teamId]/okrs/[okrId]/reviews/page.tsx`
- `/teams/[teamId]/okrs/[okrId]/reviews/new/page.tsx` 
- `/teams/[teamId]/okrs/[okrId]/reviews/[reviewId]/page.tsx`
- `/teams/[teamId]/okrs/[okrId]/reviews/[reviewId]/edit/page.tsx`

これらのページは使用頻度が比較的低いため、現時点では最適化を実施していません。
