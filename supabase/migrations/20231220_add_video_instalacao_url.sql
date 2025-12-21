-- Add video_url_instalacao field to configuracoes_sistema table
ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS video_url_instalacao TEXT;

-- Add comment
COMMENT ON COLUMN configuracoes_sistema.video_url_instalacao IS 'URL do vídeo tutorial de instalação PWA (YouTube/Vimeo embed)';
