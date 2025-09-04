// Importa o React e o hook useState para gerenciar estado
import { useState } from 'react';

// Importa componentes visuais do React Native
import {
  StyleSheet,
  Text,
  TextInput,
  Button,
  Alert,
  ScrollView,
} from 'react-native';

// Importa a biblioteca SQLite do Expo
import * as SQLite from 'expo-sqlite';

// Variável global para armazenar a conexão com o banco
let db = null;

// --- Função para abrir (ou reutilizar) a conexão com o banco ---
async function openDb() {
  // Se já existir conexão aberta, retorna ela
  if (db) return db;

  // Caso contrário, abre um banco chamado "meu_banco.db"
  db = await SQLite.openDatabaseAsync('meu_banco.db');
  return db;
}

export default function App() {
  // Estados para os inputs do formulário
  const [nome, setNome] = useState('');
  const [salario, setSalario] = useState('');
  const [cargo, setCargo] = useState('');

  // --- Função para inserir um funcionário ---
  const adicionarFuncionario = async () => {
    // Validação: todos os campos são obrigatórios
    if (!nome.trim() || !salario.trim() || !cargo.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      // Abre a conexão com o banco
      const conn = await openDb();

      // Executa a query de inserção usando parâmetros (para evitar SQL Injection)
      await conn.runAsync(
        'INSERT INTO funcionarios (nome, salario, cargo) values (?, ?, ?);',
        [nome, parseFloat(salario), cargo] // salário convertido para número
      );

      // Mostra mensagem de sucesso
      Alert.alert('Sucesso', 'Funcionário adicionado com sucesso!');

      // Limpa os campos do formulário
      setNome('');
      setSalario('');
      setCargo('');
    } catch (error) {
      // Caso dê erro, exibe alerta e mostra log no console
      Alert.alert('Erro', 'Falha ao adicionar funcionário.');
      console.error('Erro ao inserir:', error);
    }
  };

  // --- Layout da tela ---
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Adicionar Funcionário</Text>

      {/* Campo de texto para nome */}
      <TextInput
        style={styles.input}
        placeholder="Nome do Funcionário"
        value={nome}
        onChangeText={setNome}
      />

      {/* Campo de texto para salário (somente números) */}
      <TextInput
        style={styles.input}
        placeholder="Salário"
        keyboardType="numeric"
        value={salario}
        onChangeText={setSalario}
      />

      {/* Campo de texto para cargo */}
      <TextInput
        style={styles.input}
        placeholder="Cargo"
        value={cargo}
        onChangeText={setCargo}
      />

      {/* Botão que chama a função de inserir */}
      <Button title="Adicionar Funcionário" onPress={adicionarFuncionario} />
    </ScrollView>
  );
}

// --- Estilos da tela ---
const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Faz o ScrollView ocupar espaço suficiente
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
});
