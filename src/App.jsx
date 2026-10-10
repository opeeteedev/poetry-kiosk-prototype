import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'

const CANVAS_WIDTH = 756
const CANVAS_HEIGHT = 1056
const MAX_CHARS = 300
const VALID_CHARS = /^[a-z\s]*$/
const TSPL_PLACEHOLDER = 'BITMAP 0,0,95,1056,0,1a2b3c4d5e6f...'

function renderPoemToCanvas(canvas, text) {
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 28px "Noto Sans TC", "Microsoft JhengHei", sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  const padding = 60
  const maxLineW = CANVAS_WIDTH - padding * 2
  const lineH = 40
  const words = text.split(' ')
  const lines = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word
    if (ctx.measureText(testLine).width > maxLineW && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  const totalH = lines.length * lineH
  let y = (CANVAS_HEIGHT - totalH) / 2

  for (const line of lines) {
    ctx.fillText(line, padding, y)
    y += lineH
  }
}

function App() {
  const [poem, setPoem] = useState('')
  const [tsplCommand, setTSPLCommand] = useState('')
  const [showAdmin, setShowAdmin] = useState(false)
  const [lastPrintedPoem, setLastPrintedPoem] = useState('')

  const canvasRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        setShowAdmin(!showAdmin)
      }
      if (e.key === 'Escape') {
        setShowAdmin(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showAdmin])

  const sanitizeInput = useCallback((input) => {
    return input.toLowerCase().replace(/[^a-z\s]/g, '').slice(0, MAX_CHARS)
  }, [])

  const handleInputChange = useCallback((e) => {
    const sanitized = sanitizeInput(e.target.value)
    setPoem(sanitized)
    e.target.value = sanitized
  }, [sanitizeInput])

  const handlePrint = useCallback((text) => {
    const content = text || poem
    if (!content.trim()) return
    const canvas = canvasRef.current
    if (!canvas) return
    renderPoemToCanvas(canvas, content)
    setTSPLCommand(TSPL_PLACEHOLDER)
    setLastPrintedPoem(content)
  }, [poem])

  const handleReprint = useCallback(() => {
    if (!lastPrintedPoem) return
    setPoem(lastPrintedPoem)
    if (textareaRef.current) {
      textareaRef.current.value = lastPrintedPoem
    }
    handlePrint(lastPrintedPoem)
  }, [lastPrintedPoem, handlePrint])

  const handleTestPrint = useCallback(() => {
    const testPoem = 'hello world this is a test label for the poetry kiosk'
    setPoem(testPoem)
    if (textareaRef.current) {
      textareaRef.current.value = testPoem
    }
    handlePrint(testPoem)
  }, [handlePrint])

  const charCount = poem.length
  const isValid = poem.trim().length > 0 && VALID_CHARS.test(poem)

  return (
    <div className="kiosk-app" data-admin-open={showAdmin}>
      <div className="kiosk-screen">
        <header className="kiosk-header">
          <h1 className="kiosk-title">詩歌自助列印機</h1>
          <div className="kiosk-subtitle">詩歌自助列印機</div>
        </header>

        <main className="kiosk-main">
          <section className="input-section">
            <label className="input-label" htmlFor="poem-input">
              請輸入詩句
              <span className="char-counter" data-valid={isValid}>
                {charCount} / {MAX_CHARS} 字
              </span>
            </label>
            <textarea
              ref={textareaRef}
              id="poem-input"
              className="poem-input"
              value={poem}
              onChange={handleInputChange}
              placeholder="請輸入詩句 (只能輸入 a-z 及空格，最多 300 字)"
              maxLength={MAX_CHARS}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            <div className="input-hint">
              只限小寫英文字母 a-z 及空格
            </div>
            <div className="print-section">
              <button
                className="print-btn"
                onClick={() => handlePrint()}
                disabled={!isValid}
              >
                列印
              </button>
            </div>
          </section>

          <section className="preview-section">
            <div className="canvas-container">
              <div className="card-frame">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="preview-canvas"
                  aria-label="列印預覽"
                />
              </div>
              {!tsplCommand && (
                <div className="canvas-overlay" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                  <span>列印預覽區域 (63mm × 88mm)</span>
                </div>
              )}
            </div>
            {tsplCommand && (
              <div className="tspl-output">
                <pre className="tspl-code">{tsplCommand}</pre>
              </div>
            )}
          </section>
        </main>

        <footer className="kiosk-footer">
          <div className="footer-links">
            <span>© 2026 Poetry Kiosk Hong Kong</span>
            <span>客服熱線: 2888 8888</span>
            <span>支援: support@poetrykiosk.hk</span>
          </div>
        </footer>
      </div>

      <button
        className="admin-trigger"
        onClick={() => setShowAdmin(!showAdmin)}
        aria-label={showAdmin ? '關閉管理員面板' : '開啟管理員面板'}
        aria-expanded={showAdmin}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      </button>

      {showAdmin && (
        <div className="admin-panel" role="dialog" aria-modal="true" aria-labelledby="admin-title">
          <div className="admin-backdrop" onClick={() => setShowAdmin(false)} />
          <aside className="admin-sidebar">
            <header className="admin-header">
              <h2 id="admin-title">管理員面板</h2>
              <button
                className="admin-close"
                onClick={() => setShowAdmin(false)}
                aria-label="關閉"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <div className="admin-body">
              <section className="admin-section">
                <h3>列印操作</h3>
                <div className="admin-buttons">
                  <button
                    className="admin-btn primary"
                    onClick={handleReprint}
                    disabled={!lastPrintedPoem}
                  >
                    重印上一份
                  </button>
                  <button
                    className="admin-btn secondary"
                    onClick={handleTestPrint}
                  >
                    列印測試標籤
                  </button>
                </div>
                {lastPrintedPoem && (
                  <div className="last-job">
                    <span className="last-job-label">上一份列印:</span>
                    <span className="last-job-text">{lastPrintedPoem.slice(0, 80)}{lastPrintedPoem.length > 80 ? '...' : ''}</span>
                  </div>
                )}
              </section>

              <section className="admin-section">
                <h3>系統日誌</h3>
                <div className="log-viewer">
                  <div className="log-header">
                    <span>printer.log</span>
                    <span className="log-retention">每日輪換，保留7天</span>
                  </div>
                  <pre className="log-content">[2026-10-10 09:15:22] INFO  Kiosk started successfully
[2026-10-10 09:15:45] INFO  Print job #001 completed (127 chars)
[2026-10-10 09:22:10] INFO  Print job #002 completed (89 chars)
[2026-10-10 09:30:05] INFO  Print job #003 completed (203 chars)
[2026-10-10 09:45:33] INFO  Admin panel accessed
[2026-10-10 10:00:00] INFO  Daily log rotation completed
[2026-10-10 10:00:01] INFO  Retention policy: 7 days applied
[2026-10-10 10:01:22] INFO  Print job #004 completed (156 chars)</pre>
                </div>
              </section>

              <section className="admin-section">
                <h3>配置設定</h3>
                <div className="config-grid">
                  <div className="config-item">
                    <label>營業時間</label>
                    <div className="config-input-row">
                      <input type="time" defaultValue="09:00" readOnly />
                      <span>至</span>
                      <input type="time" defaultValue="22:00" readOnly />
                    </div>
                    <small>每日 09:00 - 22:00 自動運作</small>
                  </div>
                  <div className="config-item">
                    <label>字元限制</label>
                    <input type="number" defaultValue={MAX_CHARS} readOnly className="config-number" />
                    <small>最大 300 字元 (小寫 a-z 及空格)</small>
                  </div>
                  <div className="config-item">
                    <label>列印機型號</label>
                    <input type="text" defaultValue="TSC TTP-244 Pro" readOnly />
                    <small>支援 TSPL 指令集</small>
                  </div>
                  <div className="config-item">
                    <label>標籤尺寸</label>
                    <input type="text" defaultValue="76mm × 106mm (756×1056 dots)" readOnly />
                    <small>203 DPI 熱敏列印</small>
                  </div>
                </div>
              </section>

              <section className="admin-section">
                <h3>快捷鍵提示</h3>
                <div className="shortcuts">
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> <span>開啟/關閉管理員面板</span>
                  <br />
                  <kbd>Esc</kbd> <span>關閉管理員面板</span>
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default App
