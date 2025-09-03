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
import * as SQLite from 'expo-sqlite';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Função para retornar instância única do banco
let dbInstance = null;
async function getDb() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('meu_banco.db');
  }
  return dbInstance;
}

// ----------------- Componente 1: Teste Conexão -----------------
function TesteConexao() {
  const [status, setStatus] = useState(
    'Verificando conexão com o banco de dados...'
  );

  useEffect(() => {
    async function testarConexao() {
      try {
        const db = await getDb();
        await db.execAsync('PRAGMA user_version;');
        setStatus('Conexão com o banco de dados estabelecida com sucesso! ');
      } catch (error) {
        console.error(error);
        setStatus('Erro ao conectar com o banco de dados.');
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

// ----------------- Componente 2: Criar Tabela -----------------
function CriarTabela() {
  const [mensagem, setMensagem] = useState('Inicializando o banco de dados...');

  const criarTabela = async () => {
    try {
      const db = await getDb();
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

// ----------------- Componente 3: Adicionar Funcionário -----------------
function AdicionarFuncionario() {
  const [nome, setNome] = useState('');
  const [salario, setSalario] = useState('');
  const [cargo, setCargo] = useState('');

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
// ----------------- Componente 4: Pesquisar Funcionário ----------------

function PesquisarFuncionario() {
  const [nomeCargo, setNomeCargo] = useState('');
  const [salarioMinimo, setSalarioMinimo] = useState('');
  const [resultados, setResultados] = useState([]);

  const pesquisarFuncionario = async () => {
    try {
      const db = await getDb();
      let query = 'SELECT * FROM funcionarios WHERE 1=1';
      const params = [];

      // Adiciona filtro por nome ou cargo
      if (nomeCargo.trim()) {
        query += ' AND (nome LIKE ? OR cargo LIKE ?)';
        params.push(`%${nomeCargo}%`, `%${nomeCargo}%`);
      }

      // Adiciona filtro por salário mínimo
      if (salarioMinimo.trim()) {
        const minSalario = parseFloat(salarioMinimo);
        if (!isNaN(minSalario)) {
          query += ' AND salario >= ?';
          params.push(minSalario);
        }
      }

      const resultadosDb = await db.getAllAsync(query, params);
      setResultados(resultadosDb);

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
      <TouchableOpacity style={styles.botao} onPress={pesquisarFuncionario}>
        <Text style={styles.textoBotao}>Pesquisar</Text>
      </TouchableOpacity>

      <FlatList
        data={resultados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.nome}</Text>
            <Text>{item.cargo}</Text>
            <Text>R$ {item.salario}</Text>
          </View>
        )}
      />
    </View>
  );
}

// ----------------- Drawer Navigator -----------------
const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Teste de Conexão">
        <Drawer.Screen name="Teste de Conexão" component={TesteConexao} />
        <Drawer.Screen name="Criar Tabela" component={CriarTabela} />
        <Drawer.Screen
          name="Adicionar Funcionário"
          component={AdicionarFuncionario}
        />
        <Drawer.Screen
          name="Pesquisar Funcionário"
          component={PesquisarFuncionario}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

// ----------------- Estilos -----------------
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
