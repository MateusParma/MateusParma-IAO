
/**
 * NOTA DE SEGURANÇA:
 * O Aplicativo está configurado para operar prioritariamente via LocalStorage.
 * Para resolver os erros de RLS (Always True) no console do Supabase, as políticas 
 * no Dashboard do Supabase devem ser alteradas de 'true' para 'auth.uid() = user_id'
 * ou desativadas se o acesso público não for estritamente necessário.
 */
export const supabase = null; 
