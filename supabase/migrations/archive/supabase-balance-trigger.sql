-- ==============================================================================
-- MIGRATION: VINCULAR TRANSAÇÕES A CONTAS BANCÁRIAS E AUTOMAÇÃO DE SALDO
-- Execute este script no SQL Editor do Supabase
-- ==============================================================================

-- 1. Adicionar coluna conta_id na tabela transacoes
ALTER TABLE public.transacoes 
ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES public.contas_bancarias(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transacoes_conta_id ON public.transacoes(conta_id);

-- 2. Função para atualizar o saldo da conta automaticamente
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- CASO 1: INSERÇÃO (Nova transação)
    IF (TG_OP = 'INSERT') THEN
        IF NEW.conta_id IS NOT NULL THEN
            IF NEW.tipo = 'entrada' THEN
                UPDATE public.contas_bancarias 
                SET saldo_atual = saldo_atual + NEW.valor 
                WHERE id = NEW.conta_id;
            ELSIF NEW.tipo = 'saida' THEN
                UPDATE public.contas_bancarias 
                SET saldo_atual = saldo_atual - NEW.valor 
                WHERE id = NEW.conta_id;
            END IF;
        END IF;
        RETURN NEW;

    -- CASO 2: DELEÇÃO (Remover transação)
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.conta_id IS NOT NULL THEN
            IF OLD.tipo = 'entrada' THEN
                UPDATE public.contas_bancarias 
                SET saldo_atual = saldo_atual - OLD.valor 
                WHERE id = OLD.conta_id;
            ELSIF OLD.tipo = 'saida' THEN
                UPDATE public.contas_bancarias 
                SET saldo_atual = saldo_atual + OLD.valor 
                WHERE id = OLD.conta_id;
            END IF;
        END IF;
        RETURN OLD;

    -- CASO 3: ATUALIZAÇÃO (Editar transação)
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Reverter o efeito da transação antiga
        IF OLD.conta_id IS NOT NULL THEN
            IF OLD.tipo = 'entrada' THEN
                UPDATE public.contas_bancarias 
                SET saldo_atual = saldo_atual - OLD.valor 
                WHERE id = OLD.conta_id;
            ELSIF OLD.tipo = 'saida' THEN
                UPDATE public.contas_bancarias 
                SET saldo_atual = saldo_atual + OLD.valor 
                WHERE id = OLD.conta_id;
            END IF;
        END IF;

        -- Aplicar o efeito da nova transação
        IF NEW.conta_id IS NOT NULL THEN
            IF NEW.tipo = 'entrada' THEN
                UPDATE public.contas_bancarias 
                SET saldo_atual = saldo_atual + NEW.valor 
                WHERE id = NEW.conta_id;
            ELSIF NEW.tipo = 'saida' THEN
                UPDATE public.contas_bancarias 
                SET saldo_atual = saldo_atual - NEW.valor 
                WHERE id = NEW.conta_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar o Trigger
DROP TRIGGER IF EXISTS trigger_update_balance ON public.transacoes;
CREATE TRIGGER trigger_update_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_account_balance();

-- 4. Recarregar Configurações
NOTIFY pgrst, 'reload config';
