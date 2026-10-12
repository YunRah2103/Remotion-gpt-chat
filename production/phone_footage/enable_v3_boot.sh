#!/data/data/com.termux/files/usr/bin/bash
# Optional convenience only. Requires separately installed Termux:Boot app.
# Android may still stop Termux; do not promise fully unattended execution.
set -euo pipefail
if [ ! -x "$HOME/yunex-v3" ]; then
    echo "Install YUNEX V3 first, then enable startup."
    exit 1
fi
mkdir -p "$HOME/.termux/boot" "$HOME/.local/share/yunex-v3"
cat > "$HOME/.termux/boot/30-yunex-v3" <<'BOOT'
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock 2>/dev/null || true
mkdir -p "$HOME/.local/share/yunex-v3"
"$HOME/yunex-v3" --loop >> "$HOME/.local/share/yunex-v3/worker.log" 2>&1 &
BOOT
chmod 700 "$HOME/.termux/boot/30-yunex-v3"
echo "Termux:Boot script installed. Install/open the official Termux:Boot app once."
echo "Allow Termux and Termux:Boot background operation in Android settings."
echo "A phone restart should now launch polling, if Android permits it."
echo "To disable auto-start: rm ~/.termux/boot/30-yunex-v3"
echo "This does not start or stop the current worker process."
