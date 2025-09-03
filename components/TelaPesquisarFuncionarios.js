import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('empresa.db');

export default function TelaPesquisarFuncionario() {
  const [pesquisa, setPesquisa] = useState('');
  const [resultados, setResultados] = useState([]);

  // Criar tabela ao montar componente, se não existir
  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS funcionarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          idade INTEGER,
          cargo TEXT NOT NULL
        );`,
        [],
        () => console.log('Tabela pronta'),
        (_, error) => {
          console.log('Erro ao criar tabela', error);
          return true;
        }
      );
    });
  }, []);

  const pesquisarFuncionario = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM funcionarios WHERE nome LIKE ?;',
        [`%${pesquisa}%`],
        (_, { rows }) => {
          setResultados(rows._array);
        },
        (_, error) => {
          console.log('Erro na consulta', error);
          Alert.alert('Erro', 'Falha ao pesquisar funcionários.');
          return true;
        }
      );
    });
  };

  return (
    <View style={estilos.container}>
      <Text style={estilos.titulo}>Pesquisar Funcionário</Text>
      <TextInput
        style={estilos.input}
        placeholder="Digite o nome"
        value={pesquisa}
        onChangeText={setPesquisa}
      />
      <TouchableOpacity style={estilos.botao} onPress={pesquisarFuncionario}>
        <Text style={estilos.textoBotao}>Pesquisar</Text>
      </TouchableOpacity>

      <FlatList
        data={resultados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={estilos.card}>
            <Text>👤 {item.nome}</Text>
            <Text>🎂 {item.idade ?? '-'}</Text>
            <Text>💼 {item.cargo}</Text>
          </View>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  titulo: { fontSize: 20, marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  botao: {
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  textoBotao: { color: '#fff' },
  card: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
});
