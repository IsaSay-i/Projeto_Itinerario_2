# Igreja Nova Geração

Site institucional e painel administrativo da Igreja Nova Geração. O projeto é composto por páginas HTML, CSS e JavaScript e, no momento, não usa um framework nem um processo de build.

## Funcionalidades

### Site público

O site principal (`index.html`) apresenta a igreja, seus ministérios, cultos, unidades e canais de contato. O formulário de contato envia mensagens pelo serviço FormSubmit.

### Área administrativa

A área administrativa permite:

- Consultar um resumo de membros, ministérios, eventos, batismos e relatórios de culto no cockpit.
- Cadastrar e editar ministérios e seus membros.
- Cadastrar e editar eventos.
- Cadastrar e editar batismos.
- Registrar a frequência dos cultos.
- Consultar notificações, atualizar o perfil e alternar o tema.

## Como executar localmente

As páginas administrativas carregam a navegação e o cabeçalho com `fetch`. Por isso, abra o projeto por um servidor HTTP local, e não diretamente como arquivo (`file://`).

1. Abra um terminal na pasta raiz do projeto.
2. Inicie um servidor estático. Com Python instalado, execute:

   ```powershell
   py -m http.server 8000
   ```

   Alternativamente, use a extensão Live Server do Visual Studio Code.

3. Acesse `http://localhost:8000/` no navegador. Para entrar na área administrativa, use o link **Área restrita** no rodapé ou acesse `http://localhost:8000/login.html`.

Não há dependências locais para instalar. Fontes, ícones e algumas bibliotecas são carregados de serviços externos; sem conexão com a internet, esses recursos podem não aparecer. O gráfico do cockpit possui uma alternativa local caso o Chart.js não carregue.

## Acesso administrativo de demonstração

Na primeira utilização em um navegador sem usuários previamente salvos, o projeto cria uma conta local de demonstração:

- **E-mail:** `admin@ng.com.br`
- **Senha:** `Admin@123`

Essas credenciais estão no código do navegador e **não são seguras para uso real**. O login é demonstrativo e não substitui autenticação feita por um servidor.

## Armazenamento de dados

Os dados administrativos são guardados no `localStorage` do navegador utilizado. A sessão usa `sessionStorage`. Na prática:

- Os dados não são compartilhados entre navegadores, dispositivos ou usuários.
- Limpar os dados do site no navegador pode apagar os cadastros.
- Não existe atualmente uma base de dados central nem um mecanismo de backup.

Faça cópias dos dados antes de limpar o armazenamento do navegador. Para uso real por uma equipe ou para guardar dados pessoais, o projeto precisa de backend com autenticação, autorização e persistência segura.

## Estrutura do projeto

```text
.
├── index.html                 # Site institucional
├── login.html                 # Acesso à área administrativa
├── assets/
│   ├── css/                   # Estilos do site e do login
│   ├── img/                   # Imagens, identidade visual e vídeo
│   └── js/                    # Interações do site e autenticação demonstrativa
└── dsh_novageracao/
    ├── cockpit.html           # Resumo administrativo
    ├── ministerios.html       # Ministérios e membros
    ├── eventos.html           # Eventos
    ├── batismo.html           # Batismos
    ├── relatorio-culto.html   # Registros de frequência dos cultos
    ├── header.html            # Cabeçalho carregado pelo painel
    ├── sidebar.html           # Menu lateral carregado pelo painel
    └── assets/
        ├── css/               # Estilos do painel
        └── js/                # Lógica do painel e armazenamento local
```
