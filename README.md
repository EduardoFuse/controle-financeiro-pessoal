# Meu Financeiro

Painel de controle financeiro pessoal feito com HTML, CSS e JavaScript puro. Os dados ficam somente no `localStorage` do navegador: não há cadastro, servidor ou envio de informações financeiras para terceiros.

## Recursos

- resumo mensal de saldo, receitas, despesas e compromissos recorrentes;
- gráfico de despesas por categoria e indicador de uso da renda;
- cadastro, edição, exclusão, pesquisa e filtros de lançamentos;
- parcelas e despesas recorrentes;
- backup e restauração em JSON;
- exportação mensal em CSV;
- tema claro/escuro e layout responsivo;
- migração automática dos dados da versão anterior.

## Como usar

Acesse a [versão publicada no GitHub Pages](https://eduardofuse.github.io/controle-financeiro-pessoal/) ou abra o arquivo `index.html` em um navegador moderno.

> Importante: limpar os dados do navegador pode apagar os lançamentos. Use o botão **Backup** regularmente e guarde o arquivo JSON em um local seguro.

## Desenvolvimento

O projeto não possui dependências nem etapa de compilação. Para testar localmente, use um servidor estático:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000`.

## Privacidade

Os lançamentos são salvos apenas no dispositivo e navegador atuais. Este projeto é voltado a uso pessoal e não substitui orientação financeira profissional.
