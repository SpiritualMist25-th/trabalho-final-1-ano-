

// pega um elemento da página
function pegar(seletor) {
  return document.querySelector(seletor);
}

// lê o banco de dados do navegador (localstorage)
function lerDados(chave, padrao) {
  var texto = localStorage.getItem(chave);
  if (texto === null) {
    return padrao;
  }
  return JSON.parse(texto);
}

// salva no banco de dados local 
function salvarDados(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

// mostra mensagem de alerta na tela
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



// função do modo escuro da pagína 
function aplicarConfiguracoes() {
  var config = lerDados('config', { escuro: false, tamanho: '1rem' });

  // liga ou desliga o modo escuro 
  document.body.classList.toggle('escuro', config.escuro);

  return config;
}

var config = aplicarConfiguracoes();

// só na página config.html
if (pegar('#tema') !== null) {
  pegar('#tema').checked = config.escuro;
  pegar('#tamanho').value = config.tamanho;

  function salvarConfiguracoes() {
    var novaConfig = {
      escuro: pegar('#tema').checked,
      tamanho: pegar('#tamanho').value
    };
    salvarDados('config', novaConfig);
    aplicarConfiguracoes();
  }
  pegar('#tema').addEventListener('change', salvarConfiguracoes);
  pegar('#tamanho').addEventListener('change', salvarConfiguracoes);

  var logado = lerDados('sessao', null);
  if (logado !== null) {
    pegar('#statusConta').textContent = 'Logado como ' + logado.nome + '.';
  }


/* ===== SESSÃO ===== */

// troca "login" por "Olá, nome" no menu
var sessao = lerDados('sessao', null);
if (sessao !== null && pegar('#linkLogin') !== null) {
  pegar('#linkLogin').textContent = 'Olá, ' + sessao.nome;
}


/* ===== CRIAR CONTA ===== */

if (pegar('#formConta') !== null) {
  pegar('#formConta').addEventListener('submit', function (evento) {
    evento.preventDefault();

    var nome = pegar('#nome').value.trim();
    var email = pegar('#email').value.trim().toLowerCase();
    var senha = pegar('#senha').value;
    var senha2 = pegar('#senha2').value;

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

    usuarios.push({ nome: nome, email: email, senha: senha });
    salvarDados('usuarios', usuarios);

    mostrarMensagem('Conta criada! Indo para o login...', true);
    setTimeout(function () {
      location.href = 'login.html';
    }, 1200);
  });
}


/* ===== LOGIN ===== */

if (pegar('#btnLogin') !== null) {
  pegar('#btnLogin').addEventListener('click', function () {
    var email = pegar('#email').value.trim().toLowerCase();
    var senha = pegar('#senha').value;

    // procura o usuário
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

    salvarDados('sessao', { nome: encontrado.nome, email: encontrado.email });
    location.href = 'post.html';
  });
}


/* ===== POSTS ===== */

var imagemAtual = '';

// mostra os posts salvos
function mostrarPosts() {
  var feed = pegar('#feed');
  if (feed === null) {
    return;
  }

  var posts = lerDados('posts', []);
  feed.innerHTML = '';

  if (posts.length === 0) {
    feed.textContent = 'Nenhum post ainda. Seja o primeiro a publicar!';
    return;
  }

  // de trás pra frente: o mais novo fica em cima
  for (var i = posts.length - 1; i >= 0; i--) {
    var post = posts[i];

    var artigo = document.createElement('article');

    var titulo = document.createElement('h3');
    titulo.textContent = post.titulo;

    var info = document.createElement('small');
    info.textContent = post.jogo + ' · por ' + post.autor;

    var descricao = document.createElement('p');
    descricao.textContent = post.descricao;

    artigo.appendChild(titulo);
    artigo.appendChild(info);
    artigo.appendChild(descricao);

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

    // transforma a imagem em texto
    var leitor = new FileReader();
    leitor.onload = function () {
      imagemAtual = leitor.result;
      pegar('#previewImg').src = imagemAtual;
      pegar('#imagePreview').hidden = false;
      mostrarMensagem('', true);
    };
    leitor.readAsDataURL(arquivo);
  });

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

    var quemEstaLogado = lerDados('sessao', null);
    if (quemEstaLogado === null) {
      mostrarMensagem('Faça login para publicar.', false);
      return;
    }

    var posts = lerDados('posts', []);
    posts.push({
      titulo: pegar('#titulo').value.trim(),
      jogo: pegar('#nome').value.trim(),
      descricao: pegar('#descricao').value.trim(),
      imagem: imagemAtual,
      autor: quemEstaLogado.nome
    });

    // se o localStorage encher, cai no catch
    try {
      salvarDados('posts', posts);
    } catch (erro) {
      mostrarMensagem('Sem espaço para salvar. Tente uma imagem menor.', false);
      return;
    }

    evento.target.reset();
    imagemAtual = '';
    pegar('#imagePreview').hidden = true;
    mostrarMensagem('Publicado!', true);
    mostrarPosts();
  });
}

mostrarPosts();


/* ===== CARROSSEL ===== */

var galeria = pegar('.galeria');

if (galeria !== null) {
  var slides = galeria.querySelectorAll('.images');
  var atual = 0;

  // imagem que não existe vira quadro cinza
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

  // mostra só o slide n
  function mostrarSlide(n) {
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
