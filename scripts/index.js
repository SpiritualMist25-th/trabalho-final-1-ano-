/* ===== FUNÇÕES AJUDANTES ===== */
/* essas funções eu fiz pra não ficar repetindo código */

// pega um elemento da página (se não achar, volta null)
function pegar(seletor) {
  return document.querySelector(seletor);
}

// lê do localStorage
// se não tiver nada salvo, volta o valor "padrao"
function lerDados(chave, padrao) {
  var texto = localStorage.getItem(chave);
  if (texto === null) {
    return padrao;
  }
  // o localStorage guarda só texto, então converto de volta
  return JSON.parse(texto);
}

// salva no localStorage (converte pra texto antes)
function salvarDados(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

// mostra aviso na tela
// verde se deu certo, vermelho se deu erro
function mostrarMensagem(texto, deuCerto) {
  var p = pegar('.msg');
  if (p === null) {
    return;
  }
  p.textContent = texto;
  if (deuCerto) {
    p.style.color = 'green';
  } else {
    p.style.color = 'red';
  }
}


/* ===== CONFIGURAÇÕES ===== */
/* esse bloco roda em todas as páginas, pra o modo escuro
   e o tamanho do texto valerem no site inteiro */

// aplica modo escuro e tamanho do texto
function aplicarConfiguracoes() {
  // pega o que está salvo (se não tiver, usa claro e tamanho normal)
  var config = lerDados('config', { escuro: false, tamanho: '1rem' });

  // modo escuro: coloca ou tira a classe "escuro" no body
  // as cores dessa classe estão no estilo.css
  document.body.classList.toggle('escuro', config.escuro);

  // tamanho do texto no body
  document.body.style.fontSize = config.tamanho;

  // os links têm tamanho próprio no css, então mudo eles separado
  var links = document.querySelectorAll('a');
  for (var i = 0; i < links.length; i++) {
    links[i].style.fontSize = config.tamanho;
  }

  return config;
}

// aplica assim que a página abre
var config = aplicarConfiguracoes();

// só na página config.html (se existir o checkbox #tema)
if (pegar('#tema') !== null) {
  // deixa o checkbox e o select igual ao que está salvo
  pegar('#tema').checked = config.escuro;
  pegar('#tamanho').value = config.tamanho;

  // salva o que a pessoa escolheu e já aplica na hora
  function salvarConfiguracoes() {
    var novaConfig = {
      escuro: pegar('#tema').checked,
      tamanho: pegar('#tamanho').value
    };
    salvarDados('config', novaConfig);
    aplicarConfiguracoes();
  }
  // "change" acontece quando a pessoa muda o campo
  pegar('#tema').addEventListener('change', salvarConfiguracoes);
  pegar('#tamanho').addEventListener('change', salvarConfiguracoes);

  // mostra quem está logado
  var logado = lerDados('sessao', null);
  if (logado !== null) {
    pegar('#statusConta').textContent = 'Logado como ' + logado.nome + '.';
  }

  // botão sair (tira só a sessão, as contas continuam)
  pegar('#sair').addEventListener('click', function () {
    localStorage.removeItem('sessao');
    location.href = 'login.html';
  });

  // botão apagar tudo (pergunta antes de apagar)
  pegar('#apagar').addEventListener('click', function () {
    if (confirm('Apagar contas, posts e configurações deste navegador?')) {
      localStorage.clear();
      location.reload();
    }
  });
}


/* ===== SESSÃO ===== */
/* sessão é quem está logado agora */

// troca "login" por "Olá, nome" no menu
var sessao = lerDados('sessao', null);
if (sessao !== null && pegar('#linkLogin') !== null) {
  pegar('#linkLogin').textContent = 'Olá, ' + sessao.nome;
}


/* ===== CRIAR CONTA ===== */

// só na página criar_conta.html
if (pegar('#formConta') !== null) {
  pegar('#formConta').addEventListener('submit', function (evento) {
    // impede a página de recarregar ao enviar o formulário
    evento.preventDefault();

    // trim tira os espaços e toLowerCase deixa o e-mail minúsculo
    var nome = pegar('#nome').value.trim();
    var email = pegar('#email').value.trim().toLowerCase();
    var senha = pegar('#senha').value;
    var senha2 = pegar('#senha2').value;

    // confere se está tudo certo, se não estiver mostra o erro e para
    if (nome === '' || email.indexOf('@') === -1) {
      mostrarMensagem('Preencha o nome e um e-mail válido.', false);
      return;
    }
    if (senha.length < 6) {
      mostrarMensagem('A senha precisa ter pelo menos 6 caracteres.', false);
      return;
    }
    if (senha !== senha2) {
      mostrarMensagem('As senhas não são iguais.', false);
      return;
    }

    // vê se o e-mail já existe
    var usuarios = lerDados('usuarios', []);
    for (var i = 0; i < usuarios.length; i++) {
      if (usuarios[i].email === email) {
        mostrarMensagem('Este e-mail já tem conta. Faça login.', false);
        return;
      }
    }

    // adiciona o usuário novo na lista e salva
    usuarios.push({ nome: nome, email: email, senha: senha });
    salvarDados('usuarios', usuarios);

    mostrarMensagem('Conta criada! Indo para o login...', true);
    // espera um pouquinho pra dar tempo de ler a mensagem
    setTimeout(function () {
      location.href = 'login.html';
    }, 1200);
  });
}


/* ===== LOGIN ===== */

// só na página login.html
if (pegar('#btnLogin') !== null) {
  pegar('#btnLogin').addEventListener('click', function () {
    var email = pegar('#email').value.trim().toLowerCase();
    var senha = pegar('#senha').value;

    // procura o usuário (e-mail e senha têm que bater)
    var usuarios = lerDados('usuarios', []);
    var encontrado = null;
    for (var i = 0; i < usuarios.length; i++) {
      if (usuarios[i].email === email && usuarios[i].senha === senha) {
        encontrado = usuarios[i];
      }
    }

    if (encontrado === null) {
      mostrarMensagem('E-mail ou senha incorretos.', false);
      return;
    }

    // login certo: salvo a sessão (sem a senha) e vou pra página de posts
    salvarDados('sessao', { nome: encontrado.nome, email: encontrado.email });
    location.href = 'post.html';
  });
}


/* ===== POSTS ===== */

// guarda a imagem escolhida até a pessoa publicar
var imagemAtual = '';

// mostra os posts salvos
function mostrarPosts() {
  var feed = pegar('#feed');
  if (feed === null) {
    return;
  }

  var posts = lerDados('posts', []);
  feed.innerHTML = ''; // limpa o feed antes de mostrar de novo

  if (posts.length === 0) {
    feed.textContent = 'Nenhum post ainda. Seja o primeiro a publicar!';
    return;
  }

  // de trás pra frente: o mais novo fica em cima
  for (var i = posts.length - 1; i >= 0; i--) {
    var post = posts[i];

    // crio cada parte do post com createElement
    var artigo = document.createElement('article');

    var titulo = document.createElement('h3');
    titulo.textContent = post.titulo;

    var info = document.createElement('small');
    info.textContent = post.jogo + ' · por ' + post.autor;

    var descricao = document.createElement('p');
    descricao.textContent = post.descricao;

    // coloco tudo dentro do article
    artigo.appendChild(titulo);
    artigo.appendChild(info);
    artigo.appendChild(descricao);

    // só cria a imagem se o post tiver imagem
    if (post.imagem !== '') {
      var imagem = document.createElement('img');
      imagem.src = post.imagem;
      imagem.style.maxWidth = '100%';
      artigo.appendChild(imagem);
    }

    feed.appendChild(artigo);
  }
}

// escolher imagem
if (pegar('#imagem') !== null) {
  pegar('#imagem').addEventListener('change', function (evento) {
    var arquivo = evento.target.files[0];
    if (arquivo === undefined) {
      return;
    }

    // limite de 1 MB (o localStorage é pequeno)
    if (arquivo.size > 1024 * 1024) {
      evento.target.value = '';
      mostrarMensagem('A imagem passa de 1 MB.', false);
      return;
    }

    // transforma a imagem em texto pra poder salvar
    var leitor = new FileReader();
    // quando terminar de ler, mostra a pré-visualização
    leitor.onload = function () {
      imagemAtual = leitor.result;
      pegar('#previewImg').src = imagemAtual;
      pegar('#imagePreview').hidden = false;
      mostrarMensagem('', true);
    };
    leitor.readAsDataURL(arquivo);
  });

  // botão de remover a imagem escolhida
  pegar('#removeImg').addEventListener('click', function () {
    imagemAtual = '';
    pegar('#imagem').value = '';
    pegar('#imagePreview').hidden = true;
  });
}

// publicar
if (pegar('#formPost') !== null) {
  pegar('#formPost').addEventListener('submit', function (evento) {
    evento.preventDefault();

    // só publica se estiver logado
    var quemEstaLogado = lerDados('sessao', null);
    if (quemEstaLogado === null) {
      mostrarMensagem('Faça login para publicar.', false);
      return;
    }

    // adiciona o post novo no final da lista
    var posts = lerDados('posts', []);
    posts.push({
      titulo: pegar('#titulo').value.trim(),
      jogo: pegar('#nome').value.trim(),
      descricao: pegar('#descricao').value.trim(),
      imagem: imagemAtual,
      autor: quemEstaLogado.nome
    });

    // se o localStorage encher, dá erro e cai no catch
    try {
      salvarDados('posts', posts);
    } catch (erro) {
      mostrarMensagem('Sem espaço para salvar. Tente uma imagem menor.', false);
      return;
    }

    // deu certo: limpa o formulário e mostra os posts de novo
    evento.target.reset();
    imagemAtual = '';
    pegar('#imagePreview').hidden = true;
    mostrarMensagem('Publicado!', true);
    mostrarPosts();
  });
}

// mostra os posts quando a página abre
mostrarPosts();


/* ===== CARROSSEL ===== */

var galeria = pegar('.galeria');

// só na página que tem a galeria
if (galeria !== null) {
  var slides = galeria.querySelectorAll('.images');
  var atual = 0; // qual slide está aparecendo

  // imagem que não existe vira quadro cinza
  // (a função dentro do for serve pra guardar o valor certo do i)
  for (var i = 0; i < slides.length; i++) {
    (function (numero) {
      var img = slides[numero].querySelector('img');
      img.addEventListener('error', function () {
        img.style.display = 'none';
        slides[numero].style.background = 'gray';
        slides[numero].style.height = '400px';
        slides[numero].textContent = 'Imagem ' + (numero + 1);
      });
    })(i);
  }

  // mostra só o slide n e esconde os outros
  function mostrarSlide(n) {
    // se passou do último, volta pro primeiro
    if (n >= slides.length) {
      n = 0;
    }
    atual = n;
    for (var i = 0; i < slides.length; i++) {
      slides[i].hidden = (i !== atual);
    }
  }

  mostrarSlide(0);

  // troca a cada 3 segundos
  setInterval(function () {
    mostrarSlide(atual + 1);
  }, 3000);
}
