import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, ActivityIndicator, RefreshControl
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { eventsApi, EventItem } from '../../src/api/events';

function EventCard({ event }: { event: EventItem }) {
  const date = new Date(event.dateTime);
  const minPrice = event.ticketTypes.length > 0
    ? Math.min(...event.ticketTypes.filter(t => t.isActive).map(t => t.price))
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/event/${event.id}`)}>
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={styles.cardImagePlaceholderText}>🎟</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        {event.category && <Text style={styles.cardCategory}>{event.category}</Text>}
        <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.cardMeta}>
          📅 {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
        <Text style={styles.cardMeta}>📍 {event.venue}, {event.city}/{event.state}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>
            {minPrice != null
              ? (minPrice === 0 ? 'Gratuito' : `A partir de ${minPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
              : '—'}
          </Text>
          <Text style={styles.cardOrganizer}>por {event.organizerName}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function EventsScreen() {
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.list({ pageSize: 50 }),
  });

  const filtered = (data ?? []).filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar eventos ou cidade..."
          placeholderTextColor="#9e9e9e"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#6200ea" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={e => String(e.id)}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#6200ea']} />}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum evento encontrado.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchBar: { backgroundColor: '#6200ea', paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: '#212121',
  },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  cardImage: { width: '100%', height: 160 },
  cardImagePlaceholder: { backgroundColor: '#ede7f6', alignItems: 'center', justifyContent: 'center' },
  cardImagePlaceholderText: { fontSize: 48 },
  cardBody: { padding: 14 },
  cardCategory: { fontSize: 11, color: '#6200ea', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#212121', marginBottom: 6 },
  cardMeta: { fontSize: 13, color: '#616161', marginBottom: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardPrice: { fontSize: 15, fontWeight: '700', color: '#6200ea' },
  cardOrganizer: { fontSize: 11, color: '#9e9e9e' },
  empty: { textAlign: 'center', color: '#9e9e9e', marginTop: 48, fontSize: 15 },
});
