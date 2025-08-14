-- Final security fixes for remaining public tables

-- 7. Fix articles table if it exists - restrict to tier-based access
DROP POLICY IF EXISTS "articles_public_read" ON public.articles;
DROP POLICY IF EXISTS "articles_tier_access" ON public.articles;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'articles' AND table_schema = 'public'
    ) THEN
        EXECUTE 'CREATE POLICY "articles_tier_access" ON public.articles
        FOR SELECT TO authenticated
        USING (
            status = ''published'' AND (
                required_tier = ''free'' OR
                (required_tier = ''paid'' AND get_current_user_tier_optimized() IN (''paid'', ''premium'')) OR
                (required_tier = ''premium'' AND get_current_user_tier_optimized() = ''premium'') OR
                is_current_user_admin_fast()
            )
        )';
    END IF;
END $$;

-- 8. Fix courses table if it exists - restrict to tier-based access  
DROP POLICY IF EXISTS "courses_tier_access" ON public.courses;
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'courses' AND table_schema = 'public'
    ) THEN
        EXECUTE 'DROP POLICY IF EXISTS "courses_tier_access" ON public.courses';
        EXECUTE 'CREATE POLICY "courses_tier_access" ON public.courses
        FOR SELECT TO authenticated
        USING (
            status = ''published'' AND (
                required_tier = ''free'' OR
                (required_tier = ''paid'' AND get_current_user_tier_optimized() IN (''paid'', ''premium'')) OR
                (required_tier = ''premium'' AND get_current_user_tier_optimized() = ''premium'') OR
                is_current_user_admin_fast()
            )
        )';
    END IF;
END $$;

-- 9. Fix course_modules table if it exists - restrict based on parent course access
DROP POLICY IF EXISTS "course_modules_public_read" ON public.course_modules;
DROP POLICY IF EXISTS "course_modules_tier_access" ON public.course_modules;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'course_modules' AND table_schema = 'public'
    ) THEN
        EXECUTE 'CREATE POLICY "course_modules_tier_access" ON public.course_modules
        FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM courses c 
                WHERE c.id = course_modules.course_id 
                AND c.status = ''published''
                AND (
                    c.required_tier = ''free'' OR
                    (c.required_tier = ''paid'' AND get_current_user_tier_optimized() IN (''paid'', ''premium'')) OR
                    (c.required_tier = ''premium'' AND get_current_user_tier_optimized() = ''premium'') OR
                    is_current_user_admin_fast()
                )
            )
        )';
    END IF;
END $$;