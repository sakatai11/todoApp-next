# Phase 2: Branch Creation [決定論]

```bash
# ブランチ命名規約: <type>/<slug>
# type: feature | bugfix | ui | perf
# slug: NormalizedTask.branchSlug

git checkout -b feature/<slug>   # type=feature の場合
git checkout -b bugfix/<slug>    # type=bugfix の場合
git checkout -b ui/<slug>        # type=ui-change の場合
git checkout -b perf/<slug>      # type=optimization の場合
```

既に同名ブランチが存在する場合は人間に確認（上書き or 別名）。
