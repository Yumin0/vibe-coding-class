import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://nrchxfpmgglyhfsymcxb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yY2h4ZnBtZ2dseWhmc3ltY3hiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTczNjcwOCwiZXhwIjoyMDk3MzEyNzA4fQ.-LGq9607vLWVPgNLmNv2cpYCoP6rPXATL0ucFHACAu8'
)

const COHORT_ID = 1

const SECTIONS: {
  column_type: 'input' | 'progress' | 'output'
  title: string
  position: number
  todos: { title: string; subtitle?: string; position: number }[]
}[] = [
  // ── Input ──────────────────────────────────────────────────────────
  {
    column_type: 'input',
    title: '第1-2堂',
    position: 0,
    todos: [
      { title: '什麼是 Vibe Coding', subtitle: '概念 & 心態建立', position: 0 },
      { title: '前端 / 後端 / 資料庫', subtitle: '三層架構基礎概念', position: 1 },
      { title: 'Prompt 撰寫原則', subtitle: '需求表達給 AI 的邏輯', position: 2 },
      { title: '什麼是開發環境', subtitle: 'VS Code、Claude Code 的角色與用途', position: 3 },
    ],
  },
  {
    column_type: 'input',
    title: '第3-4堂',
    position: 1,
    todos: [
      { title: 'Git & GitHub 基礎', subtitle: '版本控制概念', position: 0 },
      { title: 'Vercel 部署原理', subtitle: '從本地到上線的流程', position: 1 },
      { title: 'Supabase 資料庫', subtitle: '後端連接入門', position: 2 },
      { title: 'Claude Design', subtitle: '引導 AI 產出介面設計稿', position: 3 },
    ],
  },
  {
    column_type: 'input',
    title: '第5堂',
    position: 2,
    todos: [
      { title: 'Vibe Coding 五階段流程複習', subtitle: 'Idea → 建置 → 部署 → 優化 → 迭代', position: 0 },
      { title: '初階 / 進階 / 商用三個發展層次', subtitle: '各層所需的核心知識面向', position: 1 },
    ],
  },

  // ── Progress ───────────────────────────────────────────────────────
  {
    column_type: 'progress',
    title: '產品定義文件',
    position: 0,
    todos: [
      { title: '目標使用者 Persona', position: 0 },
      { title: '痛點 & 問題定義', subtitle: 'Why this product', position: 1 },
      { title: '核心功能清單', subtitle: 'MVP scope', position: 2 },
      { title: '使用者流程', subtitle: 'User flow / Sitemap', position: 3 },
      { title: '介面草圖', subtitle: 'UI Wireframe', position: 4 },
    ],
  },
  {
    column_type: 'progress',
    title: 'AI 產出物',
    position: 1,
    todos: [
      { title: 'Project Spec', subtitle: 'AI 生成規格文件', position: 0 },
      { title: 'Database Schema', subtitle: '資料結構設計', position: 1 },
      { title: 'Codebase 初始化', subtitle: 'Repo & 結構建立', position: 2 },
      { title: 'CLAUDE.md', subtitle: 'AI 協作規則文件', position: 3 },
      { title: 'Roadmap', subtitle: '功能開發清單', position: 4 },
    ],
  },
  {
    column_type: 'progress',
    title: '第5堂',
    position: 2,
    todos: [
      { title: '觀摩學員成果', subtitle: '找出自己工具可新增的功能靈感', position: 0 },
      { title: '訂定個人短期 & 中期 Vibe Coding 目標', position: 1 },
    ],
  },

  // ── Output ─────────────────────────────────────────────────────────
  {
    column_type: 'output',
    title: '技術交付',
    position: 0,
    todos: [
      { title: '開發環境建置完成', subtitle: 'VS Code + Claude Code 可實際運行', position: 0 },
      { title: '資料庫建立', subtitle: 'Supabase', position: 1 },
      { title: 'UI 初版完成', subtitle: 'HTML / Tailwind', position: 2 },
      { title: 'CRUD 驗證', subtitle: '新增、查看、修改、刪除', position: 3 },
      { title: '工具部署上線', subtitle: 'Vercel', position: 4 },
      { title: '介面美化', subtitle: 'Claude Design 實作', position: 5 },
      { title: '行動裝置安裝設定', position: 6 },
      { title: '功能測試 & Debug', position: 7 },
      { title: 'Domain 設定', subtitle: '自訂網域綁定', position: 8 },
    ],
  },
  {
    column_type: 'output',
    title: '最終成果',
    position: 1,
    todos: [
      { title: '成果 Pitch 簡報', position: 0 },
      { title: '個人自學路線圖', subtitle: '短中期目標清單', position: 1 },
      { title: '可運作網址', subtitle: '完成所有 todo 後解鎖', position: 2 },
    ],
  },
]

async function main() {
  console.log('🗑  刪除 cohort 1 現有 sections...')

  // Delete todos first (no CASCADE defined), then sections
  const { data: existingSections } = await supabase
    .from('sections')
    .select('id')
    .eq('cohort_id', COHORT_ID)

  if (existingSections && existingSections.length > 0) {
    const sectionIds = existingSections.map(s => s.id)

    // Get todo ids to delete todo_progress first
    const { data: existingTodos } = await supabase
      .from('todo_templates')
      .select('id')
      .in('section_id', sectionIds)

    if (existingTodos && existingTodos.length > 0) {
      const todoIds = existingTodos.map(t => t.id)
      const { error: delProgressErr } = await supabase
        .from('todo_progress')
        .delete()
        .in('todo_template_id', todoIds)
      if (delProgressErr) throw new Error(`刪除 todo_progress 失敗: ${delProgressErr.message}`)
    }

    const { error: delTodoErr } = await supabase
      .from('todo_templates')
      .delete()
      .in('section_id', sectionIds)
    if (delTodoErr) throw new Error(`刪除 todos 失敗: ${delTodoErr.message}`)

    const { error: delSecErr } = await supabase
      .from('sections')
      .delete()
      .eq('cohort_id', COHORT_ID)
    if (delSecErr) throw new Error(`刪除 sections 失敗: ${delSecErr.message}`)
  }

  console.log('✅ 舊資料清除完畢')

  // Insert sections and todos
  for (const sec of SECTIONS) {
    const { data: newSec, error: secErr } = await supabase
      .from('sections')
      .insert({ cohort_id: COHORT_ID, column_type: sec.column_type, title: sec.title, position: sec.position })
      .select('id')
      .single()

    if (secErr || !newSec) throw new Error(`新增 section "${sec.title}" 失敗: ${secErr?.message}`)

    // Insert todos for this section
    const todoRows = sec.todos.map(t => ({
      section_id: newSec.id,
      title: t.title,
      subtitle: t.subtitle ?? null,
      position: t.position,
      is_required: true,
    }))

    const { error: todoErr } = await supabase.from('todo_templates').insert(todoRows)
    if (todoErr) throw new Error(`新增 todos for "${sec.title}" 失敗: ${todoErr.message}`)

    console.log(`  ✔ ${sec.column_type} / ${sec.title} — ${sec.todos.length} todos`)
  }

  // Set unlock_after for 可運作網址 (last todo in 最終成果)
  // Find 個人自學路線圖 id first
  const { data: outputSec } = await supabase
    .from('sections')
    .select('id')
    .eq('cohort_id', COHORT_ID)
    .eq('title', '最終成果')
    .single()

  if (outputSec) {
    const { data: todos } = await supabase
      .from('todo_templates')
      .select('id, title')
      .eq('section_id', outputSec.id)
      .order('position')

    if (todos && todos.length >= 3) {
      const unlockTarget = todos[2] // 可運作網址
      const prerequisite = todos[1] // 個人自學路線圖
      await supabase
        .from('todo_templates')
        .update({ unlock_after: prerequisite.id })
        .eq('id', unlockTarget.id)
      console.log(`  🔒 可運作網址 unlock_after → 個人自學路線圖`)
    }
  }

  console.log('\n🎉 Seed 完成！')
}

main().catch(err => { console.error(err); process.exit(1) })
