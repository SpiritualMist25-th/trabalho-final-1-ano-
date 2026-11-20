/* ===== FUNÇÕES AJUDANTES ===== */
/* essas funções eu fiz pra não ficar repetindo código */

// pega um elemento da página (se não achar, volta null)
function pegar(seletor) {
  return document.querySelector(seletor);
}

// lê do localStorage
// se não tiver nada salvo, volta o valor "padrao"
// (agora só uso o localStorage pras configurações: modo escuro e tamanho)
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
   e o tamanho do texto valerem no site inteiro.
   Isso continua no localStorage porque é uma preferência
   de cada pessoa, não precisa ir pra nuvem. */

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

  // botão apagar configurações (pergunta antes de apagar)
  // obs: as contas e os posts ficam no Firebase, isso só apaga o tema
  pegar('#apagar').addEventListener('click', function () {
    if (confirm('Apagar as configurações (tema e tamanho do texto) deste navegador?')) {
      localStorage.clear();
      location.reload();
    }
  });
}


/* ===== IMAGEM DO POST (post.html) ===== */

// guarda a imagem escolhida até a pessoa publicar
var imagemAtual = '';

// escolher imagem
if (pegar('#imagem') !== null) {
  pegar('#imagem').addEventListener('change', function (evento) {
    var arquivo = evento.target.files[0];
    if (arquivo === undefined) {
      return;
    }

    // limite de 500 KB
    // (cada post no banco aceita no máximo uns 1 MB, e a imagem
    //  vira um texto maior que o arquivo original)
    if (arquivo.size > 500 * 1024) {
      evento.target.value = '';
      mostrarMensagem('A imagem passa de 500 KB.', false);
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


/* ===== FIREBASE (contas e posts na nuvem) =====
   Tudo que precisa de internet fica aqui embaixo:
   criar conta, login, sair e posts.
   O Authentication cuida das contas (e guarda a senha de forma segura)
   e o Firestore guarda os posts. */

// configuração do meu projeto (copiei do console do Firebase)
var firebaseConfig = {
  apiKey: "AIzaSyAfGqYXywbzDSF6dK1TpHPcrPJxmVjMHRc",
  authDomain: "gamepossst.firebaseapp.com",
  projectId: "gamepossst",
  storageBucket: "gamepossst.firebasestorage.app",
  messagingSenderId: "1093158958083",
  appId: "1:1093158958083:web:bb63ddc53d0c6ad7620a36"
};

// nome da coleção (a "pasta") onde ficam os posts no Firestore
// (tem que ser o mesmo nome que está nas regras do Firestore)
var COLECAO = 'posts';

// de onde baixar os arquivos do Firebase
var URL_FIREBASE = 'https://www.gstatic.com/firebasejs/13.2.0/';

// essa função baixa o Firebase e liga tudo.
// é "async" porque baixar da internet demora um pouquinho,
// e o "await" espera terminar antes de seguir
async function iniciarFirebase() {

  // import() baixa os arquivos do Firebase na hora
  var modApp = await import(URL_FIREBASE + 'firebase-app.js');
  var modAuth = await import(URL_FIREBASE + 'firebase-auth.js');
  var modBanco = await import(URL_FIREBASE + 'firebase-firestore.js');

  // liga o app, o login (auth) e o banco (db)
  var app = modApp.initializeApp(firebaseConfig);
  var auth = modAuth.getAuth(app);
  var db = modBanco.getFirestore(app);

  // pega o nome de quem está logado (se não tiver nome, usa o e-mail)
  function nomeDe(usuario) {
    if (usuario.displayName) {
      return usuario.displayName;
    }
    return usuario.email;
  }


  /* ----- SESSÃO ----- */
  /* o Firebase avisa sozinho quando alguém entra ou sai.
     ele também lembra a pessoa logada, mesmo fechando a página */

  modAuth.onAuthStateChanged(auth, function (usuario) {
    // troca "login" por "Olá, nome" no menu
    if (usuario !== null && pegar('#linkLogin') !== null) {
      pegar('#linkLogin').textContent = 'Olá, ' + nomeDe(usuario);
    }

    // na página config.html mostra quem está logado
    if (pegar('#statusConta') !== null) {
      if (usuario !== null) {
        pegar('#statusConta').textContent = 'Logado como ' + nomeDe(usuario) + '.';
      } else {
        pegar('#statusConta').textContent = 'Você não está logado.';
      }
    }
  });

  // botão sair (config.html): sai da conta e vai pro login
  if (pegar('#sair') !== null) {
    pegar('#sair').addEventListener('click', async function () {
      await modAuth.signOut(auth);
      location.href = 'login.html';
    });
  }


  /* ----- CRIAR CONTA ----- */

  // só na página criar_conta.html
  if (pegar('#formConta') !== null) {
    pegar('#formConta').addEventListener('submit', async function (evento) {
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

      // tenta criar a conta no Firebase
      // (ele mesmo avisa se o e-mail já existe, não preciso procurar)
      try {
        var resultado = await modAuth.createUserWithEmailAndPassword(auth, email, senha);

        // o Firebase só guarda e-mail e senha, então salvo o nome aqui
        await modAuth.updateProfile(resultado.user, { displayName: nome });

        // criar a conta já deixa a pessoa logada, mas quero que ela
        // passe pelo login, então saio da conta antes
        await modAuth.signOut(auth);

        mostrarMensagem('Conta criada! Indo para o login...', true);
        // espera um pouquinho pra dar tempo de ler a mensagem
        setTimeout(function () {
          location.href = 'login.html';
        }, 1200);
      } catch (erro) {
        // o erro.code diz o que aconteceu
        if (erro.code === 'auth/email-already-in-use') {
          mostrarMensagem('Este e-mail já tem conta. Faça login.', false);
        } else if (erro.code === 'auth/invalid-email') {
          mostrarMensagem('Esse e-mail não é válido.', false);
        } else if (erro.code === 'auth/network-request-failed') {
          mostrarMensagem('Sem internet. Tente de novo.', false);
        } else {
          console.log(erro);
          mostrarMensagem('Não foi possível criar a conta.', false);
        }
      }
    });
  }


  /* ----- LOGIN ----- */

  // só na página login.html
  if (pegar('#btnLogin') !== null) {
    pegar('#btnLogin').addEventListener('click', async function () {
      var email = pegar('#email').value.trim().toLowerCase();
      var senha = pegar('#senha').value;

      try {
        // o Firebase confere o e-mail e a senha pra mim
        await modAuth.signInWithEmailAndPassword(auth, email, senha);
        // login certo: vai pra página de posts
        location.href = 'post.html';
      } catch (erro) {
        if (erro.code === 'auth/network-request-failed') {
          mostrarMensagem('Sem internet. Tente de novo.', false);
        } else {
          mostrarMensagem('E-mail ou senha incorretos.', false);
        }
      }
    });
  }


  /* ----- POSTS ----- */

  // mostra os posts que estão no banco
  async function mostrarPosts() {
    var feed = pegar('#feed');
    if (feed === null) {
      return;
    }

    feed.textContent = 'Carregando posts...';

    var resultado;
    try {
      // monta a busca: pega a coleção e ordena do mais novo pro mais antigo
      var busca = modBanco.query(
        modBanco.collection(db, COLECAO),
        modBanco.orderBy('criadoEm', 'desc')
      );
      resultado = await modBanco.getDocs(busca);
    } catch (erro) {
      console.log(erro);
      feed.textContent = 'Não foi possível carregar os posts.';
      return;
    }

    feed.innerHTML = ''; // limpa o feed antes de mostrar de novo

    if (resultado.empty) {
      feed.textContent = 'Nenhum post ainda. Seja o primeiro a publicar!';
      return;
    }

    // já vem do mais novo pro mais antigo, então só percorro
    resultado.forEach(function (documento) {
      // data() devolve os dados do post
      var post = documento.data();

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
        imagem.style.maxWidth = '50%';
        artigo.appendChild(imagem);
      }

      feed.appendChild(artigo);
    });
  }

  // publicar
  if (pegar('#formPost') !== null) {
    pegar('#formPost').addEventListener('submit', async function (evento) {
      evento.preventDefault();

      var formulario = evento.target;

      // só publica se estiver logado
      var usuario = auth.currentUser;
      if (usuario === null) {
        mostrarMensagem('Faça login para publicar.', false);
        return;
      }

      // tenta salvar o post no banco
      // (se der erro, cai no catch e o site não quebra)
      try {
        await modBanco.addDoc(modBanco.collection(db, COLECAO), {
          titulo: pegar('#titulo').value.trim(),
          jogo: pegar('#nome').value.trim(),
          descricao: pegar('#descricao').value.trim(),
          imagem: imagemAtual,
          autor: nomeDe(usuario),
          autorId: usuario.uid,
          criadoEm: modBanco.serverTimestamp() // hora certa, marcada pelo servidor
        });
      } catch (erro) {
        console.log(erro);
        mostrarMensagem('Não foi possível publicar. Tente uma imagem menor.', false);
        return;
      }

      // deu certo: limpa o formulário e mostra os posts de novo
      formulario.reset();
      imagemAtual = '';
      pegar('#imagePreview').hidden = true;
      mostrarMensagem('Publicado!', true);
      await mostrarPosts();
    });
  }

  // mostra os posts quando a página abre
  mostrarPosts();
}

// liga o Firebase. Se der erro (ex.: sem internet), só avisa
iniciarFirebase().catch(function (erro) {
  console.log(erro);
  mostrarMensagem('Não foi possível conectar ao Firebase.', false);
});
