DO $$
DECLARE
  v_course_id bigint;
  v_cohort_id bigint;
  v_sec_input_id bigint;
  v_sec_progress_id bigint;
  v_sec_output_id bigint;
  v_todo_id1 bigint;
  v_todo_id2 bigint;
  v_todo_id3 bigint;
  v_enrollment_id bigint;
  v_user_id uuid;
BEGIN
  -- 找到第一個已註冊的用戶
  SELECT id INTO v_user_id FROM public.users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Please register an account first.';
  END IF;

  -- 課程母版
  INSERT INTO course_templates (title, level, description)
  VALUES ('Vibe Coding 入門班', 'beginner', '從零開始學習 AI 輔助開發，掌握現代 Web 開發工具')
  RETURNING id INTO v_course_id;

  -- 第一期班級
  INSERT INTO cohorts (template_id, title, status, starts_at, ends_at, max_students)
  VALUES (v_course_id, 'VCC 第一期（2026 夏）', 'active', '2026-06-18', '2026-08-31', 30)
  RETURNING id INTO v_cohort_id;

  -- 三個欄位
  INSERT INTO sections (cohort_id, column_type, title, position)
  VALUES (v_cohort_id, 'input', '學習準備', 0)
  RETURNING id INTO v_sec_input_id;

  INSERT INTO sections (cohort_id, column_type, title, position)
  VALUES (v_cohort_id, 'progress', '實作進行', 1)
  RETURNING id INTO v_sec_progress_id;

  INSERT INTO sections (cohort_id, column_type, title, position)
  VALUES (v_cohort_id, 'output', '成果展示', 2)
  RETURNING id INTO v_sec_output_id;

  -- Input 欄位 todos（有 unlock_after 鏈）
  INSERT INTO todo_templates (section_id, title, subtitle, description, is_required, position)
  VALUES (v_sec_input_id, '加入 Discord 社群', '與同學和助教保持聯繫', '掃描 QR Code 或點連結加入課程 Discord', true, 0)
  RETURNING id INTO v_todo_id1;

  INSERT INTO todo_templates (section_id, title, subtitle, description, is_required, unlock_after, position)
  VALUES (v_sec_input_id, '安裝 VS Code', '主要的程式碼編輯器', '下載並安裝 Visual Studio Code', true, v_todo_id1, 1)
  RETURNING id INTO v_todo_id2;

  INSERT INTO todo_templates (section_id, title, subtitle, description, is_required, unlock_after, position)
  VALUES (v_sec_input_id, '安裝 Claude Code', 'AI 輔助開發工具', '在 VS Code 擴充套件市場安裝 Claude Code 並完成設定', true, v_todo_id2, 2)
  RETURNING id INTO v_todo_id3;

  -- Progress 欄位 todos
  INSERT INTO todo_templates (section_id, title, subtitle, description, is_required, position)
  VALUES (v_sec_progress_id, '完成 Week 1 作業', '用 AI 建立第一個網頁', '使用 Claude Code 建立一個個人介紹頁面並截圖上傳', true, 0)
  RETURNING id INTO v_todo_id1;

  INSERT INTO todo_templates (section_id, title, subtitle, description, is_required, unlock_after, position)
  VALUES (v_sec_progress_id, '完成 Week 2 作業', '建立互動功能', '加入表單和 JavaScript 互動效果', true, v_todo_id1, 1)
  RETURNING id INTO v_todo_id2;

  INSERT INTO todo_templates (section_id, title, subtitle, description, is_required, unlock_after, position)
  VALUES (v_sec_progress_id, '完成 Week 3 作業', '串接資料庫', '使用 Supabase 儲存表單資料', true, v_todo_id2, 2)
  RETURNING id INTO v_todo_id3;

  INSERT INTO todo_templates (section_id, title, subtitle, description, is_required, unlock_after, position)
  VALUES (v_sec_progress_id, '完成 Week 4 作業', '部署上線', '把專案部署到 Vercel，附上網址', true, v_todo_id3, 3)
  RETURNING id INTO v_todo_id1;

  INSERT INTO todo_templates (section_id, title, subtitle, description, is_required, unlock_after, position)
  VALUES (v_sec_progress_id, '完成期中專案', '獨立完成一個完整功能', '自行選題，完整實作並錄製 Demo 影片', true, v_todo_id1, 4);

  -- Output 欄位 todos
  INSERT INTO todo_templates (section_id, title, subtitle, description, is_required, position)
  VALUES (v_sec_output_id, '提交作品集網址', '分享你的作品', '將個人網站或 GitHub repo 連結貼到這裡', true, 0)
  RETURNING id INTO v_todo_id1;

  INSERT INTO todo_templates (section_id, title, subtitle, description, is_required, unlock_after, position)
  VALUES (v_sec_output_id, '完成結業問卷', '給我們你的回饋', '填寫課程滿意度問卷（約 5 分鐘）', true, v_todo_id1, 1);

  -- 把第一個用戶 enroll 進班級
  INSERT INTO enrollments (student_id, cohort_id, status)
  VALUES (v_user_id, v_cohort_id, 'active')
  RETURNING id INTO v_enrollment_id;

  RAISE NOTICE 'Seed 完成！User % 已加入 cohort %', v_user_id, v_cohort_id;
END;
$$;
