# 🚀 최초 셋업 (이 PC에서 처음 작업할 때)

> 이 레포의 [`CLAUDE.md`](../../CLAUDE.md) 는 글로벌 규약 두 파일을 `@import` 로 가져옵니다:
>
> - `~/.claude/rules/thinking.md` — 사고 원칙 (Karpathy 4)
> - `~/.claude/rules/collaboration.md` — 협업/PR/Linear
>
> **이 두 파일이 없으면** Claude Code 는 글로벌 규약 없이 동작합니다. 작업 전에 반드시 셋업하세요.

원본 레포: <https://github.com/Scraps-Org/dotfiles-claude>

---

## ✅ 셋업 됐는지 확인

**PowerShell**:

```powershell
Get-Item "$HOME\.claude\rules\thinking.md", "$HOME\.claude\rules\collaboration.md" -ErrorAction SilentlyContinue | Select-Object Name, LinkType, Target
```

두 줄 모두 `LinkType: SymbolicLink` 로 출력되면 OK.

**Git Bash / Mac / Linux**:

```bash
ls -la "$HOME/.claude/rules/"
```

`thinking.md -> .../dotfiles-claude/thinking.md` 형식이면 OK.

---

## 📥 셋업 절차 (1회만)

### 1️⃣ Developer Mode 켜기 (Windows만)

관리자 권한 없이 symlink 를 만들기 위해 필요.

`Settings → Privacy & security → For developers → Developer Mode ON`

### 2️⃣ dotfiles-claude 레포 클론

```bash
git clone https://github.com/Scraps-Org/dotfiles-claude.git "$HOME/dotfiles-claude"
```

OneDrive/Dropbox 같은 클라우드 동기화 폴더 **밖** 에 둡니다 (이중 동기화 충돌 방지).

### 3️⃣ ~/.claude/rules/ symlink

**PowerShell** (Windows 권장):

```powershell
New-Item -ItemType Directory -Path "$HOME\.claude\rules" -Force | Out-Null

New-Item -ItemType SymbolicLink `
  -Path   "$HOME\.claude\rules\thinking.md" `
  -Target "$HOME\dotfiles-claude\thinking.md"

New-Item -ItemType SymbolicLink `
  -Path   "$HOME\.claude\rules\collaboration.md" `
  -Target "$HOME\dotfiles-claude\collaboration.md"
```

**Mac / Linux**:

```bash
mkdir -p "$HOME/.claude/rules"
ln -s "$HOME/dotfiles-claude/thinking.md"      "$HOME/.claude/rules/thinking.md"
ln -s "$HOME/dotfiles-claude/collaboration.md" "$HOME/.claude/rules/collaboration.md"
```

### 4️⃣ Git 글로벌 설정 (1회)

```bash
git config --global fetch.prune true
```

### 5️⃣ Node 22 LTS + pnpm

```bash
# Volta 권장:
curl https://get.volta.sh | bash
volta install node@22 pnpm

# 또는 corepack (Node 22 기본 동봉):
corepack enable
corepack prepare pnpm@latest --activate
```

### 6️⃣ 검증

```bash
node --version    # v22.x
pnpm --version    # 9.x or 10.x
test -f "$HOME/.claude/rules/thinking.md" && echo "✓ rules ready"
```

---

## 🔧 트러블슈팅

| 증상 | 해결 |
|---|---|
| `New-Item -SymbolicLink` 권한 오류 | Developer Mode OFF. Settings 에서 켜기 |
| Claude Code 가 글로벌 규약을 못 읽음 | `cat ~/.claude/rules/thinking.md` 시도. 안 되면 symlink 깨진 것 — 3️⃣ 재실행 |
| `pnpm install` 시 corepack 오류 | `corepack enable` 후 재시도 |
| dotfiles-claude clone 시 access denied | Scraps-Org 멤버십 확인. `gh auth refresh -s read:org` |

---

## 📚 참고

- 레포: <https://github.com/Scraps-Org/dotfiles-claude>
- 자세한 운영 가이드: `~/dotfiles-claude/README.md` (clone 후)
