// Importa hooks do React e componentes básicos do React Native
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  TextInput,
  Alert,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

// Importa SQLite do Expo
import * as SQLite from 'expo-sqlite';

// Importa navegação
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';


// ===============================================================
// FUNÇÃO DE ACESSO AO BANCO (Singleton)
// ===============================================================

// Guardamos a instância do banco em uma variável global
let dbInstance = null;

// Função que retorna sempre a mesma instância
async function getDb() {
  if (!dbInstance) {
    // Abre ou cria o banco "meu_banco.db"
    dbInstance = await SQLite.openDatabaseAsync('meu_banco.db');
  }
  return dbInstance;
}


// ===============================================================
// COMPONENTE 1 - Testar Conexão
// ===============================================================
function TesteConexao() {
  // Estado para armazenar a mensagem de status
  const [status, setStatus] = useState(
    'Verificando conexão com o banco de dados...'
  );

  // Executa apenas 1x quando a tela abre
  useEffect(() => {
    async function testarConexao() {
      try {
        const db = await getDb(); // pega instância do banco
        await db.execAsync('PRAGMA user_version;'); // executa comando simples
        setStatus('Conexão com o banco de dados estabelecida com sucesso! ✅');
      } catch (error) {
        console.error(error);
        setStatus('Erro ao conectar com o banco de dados ❌');
      }
    }
    testarConexao();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teste de Conexão SQLite</Text>
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}


// ===============================================================
// COMPONENTE 2 - Criar Tabela
// ===============================================================
function CriarTabela() {
  const [mensagem, setMensagem] = useState('Inicializando o banco de dados...');

  // Função que cria a tabela no banco
  const criarTabela = async () => {
    try {
      const db = await getDb();
      // Cria tabela se não existir
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS funcionarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          salario REAL NOT NULL,
          cargo TEXT NOT NULL
        );
      `);
      setMensagem('Tabela "funcionarios" criada com sucesso!');
      Alert.alert('Sucesso', 'Tabela "funcionarios" criada!');
    } catch (error) {
      console.error(error);
      setMensagem('Erro ao criar a tabela.');
      Alert.alert('Erro', 'Falha ao criar a tabela.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Tabela</Text>
      <Button title="Criar Tabela Funcionários" onPress={criarTabela} />
      <Text style={styles.statusText}>{mensagem}</Text>
    </View>
  );
}


// ===============================================================
// COMPONENTE 3 - Adicionar Funcionário
// ===============================================================
function AdicionarFuncionario() {
  // Estados para armazenar os valores digitados
  const [nome, setNome] = useState('');
  const [salario, setSalario] = useState('');
  const [cargo, setCargo] = useState('');

  // Função que insere funcionário no banco
  const adicionarFuncionario = async () => {
    if (!nome.trim() || !salario.trim() || !cargo.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      const db = await getDb();
      await db.runAsync(
        'INSERT INTO funcionarios (nome, salario, cargo) VALUES (?, ?, ?);',
        [nome, parseFloat(salario), cargo]
      );
      Alert.alert('Sucesso', 'Funcionário adicionado com sucesso!');
      // Limpa os campos
      setNome('');
      setSalario('');
      setCargo('');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao adicionar funcionário.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Adicionar Funcionário</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
      />
      <TextInput
        style={styles.input}
        placeholder="Salário"
        keyboardType="numeric"
        value={salario}
        onChangeText={setSalario}
      />
      <TextInput
        style={styles.input}
        placeholder="Cargo"
        value={cargo}
        onChangeText={setCargo}
      />
      <Button title="Adicionar Funcionário" onPress={adicionarFuncionario} />
    </ScrollView>
  );
}


// ===============================================================
// COMPONENTE 4 - Pesquisar Funcionário
// ===============================================================
function PesquisarFuncionario() {
  // Estados para filtros
  const [nomeCargo, setNomeCargo] = useState('');
  const [salarioMinimo, setSalarioMinimo] = useState('');
  // Estado que guarda os resultados da pesquisa
  const [resultados, setResultados] = useState([]);

  // Função de pesquisa
  const pesquisarFuncionario = async () => {
    try {
      const db = await getDb();

      // Monta query base
      let query = 'SELECT * FROM funcionarios WHERE 1=1';
      const params = [];

      // Filtro por nome ou cargo
      if (nomeCargo.trim()) {
        query += ' AND (nome LIKE ? OR cargo LIKE ?)';
        params.push(`%${nomeCargo}%`, `%${nomeCargo}%`);
      }

      // Filtro por salário mínimo
      if (salarioMinimo.trim()) {
        const minSalario = parseFloat(salarioMinimo);
        if (!isNaN(minSalario)) {
          query += ' AND salario >= ?';
          params.push(minSalario);
        }
      }

      // Executa a pesquisa
      const resultadosDb = await db.getAllAsync(query, params);
      setResultados(resultadosDb);

      // Se não achar nada
      if (resultadosDb.length === 0) {
        Alert.alert('Aviso', 'Nenhum funcionário encontrado.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha na pesquisa.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pesquisar Funcionário</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome ou Cargo"
        value={nomeCargo}
        onChangeText={setNomeCargo}
      />
      <TextInput
        style={styles.input}
        placeholder="Salário Mínimo"
        keyboardType="numeric"
        value={salarioMinimo}
        onChangeText={setSalarioMinimo}
      />

      {/* Botão para iniciar pesquisa */}
      <TouchableOpacity style={styles.botao} onPress={pesquisarFuncionario}>
        <Text style={styles.textoBotao}>Pesquisar</Text>
      </TouchableOpacity>

      {/* Lista com os resultados */}
      <FlatList
        data={resultados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>👤 {item.nome}</Text>
            <Text>💼 {item.cargo}</Text>
            <Text>💰 R$ {item.salario}</Text>
          </View>
        )}
      />
    </View>
  );
}


// ===============================================================
// CONFIGURAÇÃO DO MENU (Drawer Navigation)
// ===============================================================
const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Teste de Conexão">
        <Drawer.Screen name="Teste de Conexão" component={TesteConexao} />
        <Drawer.Screen name="Criar Tabela" component={CriarTabela} />
        <Drawer.Screen name="Adicionar Funcionário" component={AdicionarFuncionario} />
        <Drawer.Screen name="Pesquisar Funcionário" component={PesquisarFuncionario} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}


// ===============================================================
// ESTILOS
// ===============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusText: { marginTop: 20, fontSize: 16, textAlign: 'center' },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  botao: {
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  textoBotao: { color: '#fff' },
  card: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
  },
});
