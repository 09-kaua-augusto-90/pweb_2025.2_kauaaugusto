/* --- BANCO DE DADOS (Simulado no Navegador) --- */
let alunos = JSON.parse(localStorage.getItem('starkGymDB')) || [];

// Configuração dos Planos
const planos = {
    "Mensal": { dias: 30, valor: 100 },
    "Trimestral": { dias: 90, valor: 270 },
    "Anual": { dias: 365, valor: 900 }
};

/* --- FUNÇÃO PRINCIPAL: Carregar tudo ao abrir --- */
function init() {
    atualizarTabela();
    atualizarDashboard();
}

/* --- 1. ADICIONAR NOVO ALUNO --- */
function novoAluno() {
    // Usaremos prompts simples para capturar os dados
    const nome = prompt("Nome do Aluno:");
    if (!nome) return;

    // Pergunta o plano (simplificado para digitar 1, 2 ou 3)
    let planoOpcao = prompt("Escolha o Plano:\n1 - Mensal (R$ 100)\n2 - Trimestral (R$ 270)\n3 - Anual (R$ 900)");
    
    let nomePlano = "Mensal";
    if (planoOpcao === "2") nomePlano = "Trimestral";
    if (planoOpcao === "3") nomePlano = "Anual";

    // Cria o objeto do aluno
    const novoAluno = {
        id: Date.now(), // Gera um ID único baseado no tempo
        nome: nome,
        plano: nomePlano,
        dataMatricula: new Date().toISOString().split('T')[0] // Data de hoje (AAAA-MM-DD)
    };

    // Salva e atualiza
    alunos.push(novoAluno);
    salvarDados();
    alert("✅ Aluno cadastrado com sucesso!");
    init(); // Recarrega a tela
}

/* --- 2. SALVAR NO LOCALSTORAGE --- */
function salvarDados() {
    localStorage.setItem('starkGymDB', JSON.stringify(alunos));
}

/* --- 3. ATUALIZAR TABELA --- */
function atualizarTabela() {
    const tbody = document.getElementById('tabela-corpo');
    tbody.innerHTML = ""; // Limpa a tabela antes de recriar

    if (alunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Nenhum aluno cadastrado.</td></tr>`;
        return;
    }

    alunos.forEach((aluno, index) => {
        // Calcular status
        const statusInfo = verificarStatus(aluno.dataMatricula, aluno.plano);
        
        // Criar a linha HTML
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="student-info">
                    <div class="student-img" style="display:flex; justify-content:center; align-items:center; color:#fff; font-size:12px;">${aluno.nome[0]}</div>
                    <strong>${aluno.nome}</strong>
                </div>
            </td>
            <td>${aluno.plano}</td>
            <td>${formatarData(aluno.dataMatricula)}</td>
            <td><span class="status ${statusInfo.classe}">${statusInfo.texto}</span></td>
            <td>
                <button class="btn-edit" onclick="removerAluno(${index})" style="border-color:#F75A68; color:#F75A68;">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* --- 4. CÁLCULOS DO DASHBOARD --- */
function atualizarDashboard() {
    // Total de Alunos
    document.getElementById('dash-total').innerText = alunos.length;

    // Faturamento (Soma dos planos)
    const faturamento = alunos.reduce((total, aluno) => {
        return total + planos[aluno.plano].valor;
    }, 0);
    document.getElementById('dash-faturamento').innerText = `R$ ${faturamento.toLocaleString('pt-BR')}`;

    // Contar Vencidos
    let vencidos = 0;
    alunos.forEach(aluno => {
        const status = verificarStatus(aluno.dataMatricula, aluno.plano);
        if (status.texto === "Vencido") vencidos++;
    });
    document.getElementById('dash-vencidos').innerText = vencidos;
}

/* --- 5. UTILITÁRIOS (Datas e Status) --- */
function verificarStatus(dataMatricula, nomePlano) {
    const dataInicio = new Date(dataMatricula);
    const diasPlano = planos[nomePlano].dias;
    
    // Adiciona os dias do plano à data inicial
    const dataVencimento = new Date(dataInicio);
    dataVencimento.setDate(dataInicio.getDate() + diasPlano);
    
    const hoje = new Date();

    if (hoje > dataVencimento) {
        return { texto: "Vencido", classe: "expired" }; // expired é a classe vermelha do CSS
    } else {
        return { texto: "Ativo", classe: "active" }; // active é a classe verde do CSS
    }
}

function formatarData(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

function removerAluno(index) {
    if(confirm("Tem certeza que deseja excluir este aluno?")) {
        alunos.splice(index, 1);
        salvarDados();
        init();
    }
}

// Inicia o sistema
init();