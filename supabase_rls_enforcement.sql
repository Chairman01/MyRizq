-- SECURITY ENFORCEMENT: Portfolios RLS

-- 1. Ensure RLS is enabled
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to remove any potential misconfigurations
DROP POLICY IF EXISTS "Users can view their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can insert their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can delete their own portfolios" ON public.portfolios;

-- 3. Re-apply strict ownership policies

-- SELECT: Users can only see their own portfolios
CREATE POLICY "Users can view their own portfolios"
ON public.portfolios FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can only create portfolios for themselves
CREATE POLICY "Users can insert their own portfolios"
ON public.portfolios FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own portfolios
CREATE POLICY "Users can update their own portfolios"
ON public.portfolios FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own portfolios
CREATE POLICY "Users can delete their own portfolios"
ON public.portfolios FOR DELETE
USING (auth.uid() = user_id);
