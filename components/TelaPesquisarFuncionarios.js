// Importa os hooks do React e os componentes do React Native
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  Alert,
} from 'react-native';

// Importa o SQLite do Expo
import * as SQLite from 'expo-sqlite';

export default function App() {
  // Estado que armazena a conexão com o banco
  const [db, setDb] = useState(null);

  // Estado que guarda os resultados das pesquisas
  const [results, setResults] = useState([]);

  // Campos de pesquisa
  const [searchText, setSearchText] = useState(''); // Nome ou cargo
  const [salarioMinimo, setSalarioMinimo] = useState(''); // Salário mínimo

  // Texto de status para feedback ao usuário
  const [status, setStatus] = useState('Inicializando...');

  // --- useEffect roda apenas uma vez ao abrir o app ---
  useEffect(() => {
    async function setupDatabase() {
      try {
        // Abre (ou cria) o banco de dados de forma assíncrona
        const database = await SQLite.openDatabaseAsync('meu_banco.db');

        // Salva a referência no estado
        setDb(database);

        // Cria a tabela "funcionarios" se ela não existir
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS funcionarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            salario REAL NOT NULL,
            cargo TEXT NOT NULL
          );
        `);

        setStatus('Banco de dados e tabela prontos!');
      } catch (error) {
        console.error('Erro ao conectar ou criar tabela:', error);
        setStatus('Erro ao inicializar o banco de dados.');
        Alert.alert('Erro', 'Não foi possível conectar ao banco.');
      }
    }

    // Chama a função de setup
    setupDatabase();
  }, []); // Executa só uma vez na montagem

  // --- Função genérica para executar SELECT ---
  const executarConsulta = async (query, params = []) => {
    if (!db) {
      Alert.alert('Erro', 'O banco ainda não está pronto.');
      return;
    }

    try {
      // Executa a query e retorna todas as linhas
      const rows = await db.getAllAsync(query, params);

      // Salva os resultados no estado
      setResults(rows);

      // Caso não ache nada, mostra alerta
      if (rows.length === 0) {
        Alert.alert('Aviso', 'Nenhum resultado encontrado.');
      }
    } catch (error) {
      console.error('Erro na consulta:', error);
      Alert.alert('Erro', 'Falha ao executar a pesquisa.');
    }
  };

  // --- Consultas específicas ---
  const exibirTodos = async () => {
    await executarConsulta('SELECT * FROM funcionarios;');
  };

  const pesquisarNome = async () => {
    if (!searchText.trim()) {
      Alert.alert('Aviso', 'Digite um nome para pesquisar.');
      return;
    }
    await executarConsulta('SELECT * FROM funcionarios WHERE nome LIKE ?;', [
      `%${searchText}%`,
    ]);
  };

  const pesquisarSalario = async () => {
    const minSalario = parseFloat(salarioMinimo);
    if (isNaN(minSalario)) {
      Alert.alert('Aviso', 'Digite um número válido para o salário.');
      return;
    }
    await executarConsulta('SELECT * FROM funcionarios WHERE salario >= ?;', [
      minSalario,
    ]);
  };

  const pesquisarCargo = async () => {
    if (!searchText.trim()) {
      Alert.alert('Aviso', 'Digite um cargo para pesquisar.');
      return;
    }
    await executarConsulta('SELECT * FROM funcionarios WHERE cargo LIKE ?;', [
      `%${searchText}%`,
    ]);
  };

  // --- Renderiza cada item do FlatList ---
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text>ID: {item.id}</Text>
      <Text>Nome: {item.nome}</Text>
      <Text>Salário: R${item.salario.toFixed(2)}</Text>
      <Text>Cargo: {item.cargo}</Text>
    </View>
  );

  // --- Layout principal ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consultar Funcionários</Text>

      {/* Mostra status da conexão */}
      <Text style={styles.statusText}>{status}</Text>

      {/* Inputs de pesquisa */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nome ou Cargo"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TextInput
          style={styles.input}
          placeholder="Salário Mínimo"
          keyboardType="numeric"
          value={salarioMinimo}
          onChangeText={setSalarioMinimo}
        />
      </View>

      {/* Botões de ação */}
      <View style={styles.buttonContainer}>
        <Button title="Exibir Todos" onPress={exibirTodos} disabled={!db} />
        <Button title="Pesquisar Nome" onPress={pesquisarNome} disabled={!db} />
        <Button
          title="Salários Acima de"
          onPress={pesquisarSalario}
          disabled={!db}
        />
        <Button
          title="Pesquisar Cargo"
          onPress={pesquisarCargo}
          disabled={!db}
        />
      </View>

      {/* Lista de resultados */}
      <FlatList
        style={styles.list}
        data={results}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusText: {
    textAlign: 'center',
    marginBottom: 10,
    color: 'gray',
  },
  searchContainer: {
    flexDirection: 'column',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 20,
  },
  list: {
    width: '100%',
  },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
});
