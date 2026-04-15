import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '@/features/transactions';

type CategoryTotal = { category: string; total: number };

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function clamp(year: number, month: number): { year: number; month: number } {
  const now = new Date();
  if (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth())) {
    return { year: now.getFullYear(), month: now.getMonth() };
  }
  return { year, month };
}

function padMonth(m: number) {
  return String(m + 1).padStart(2, '0');
}

export default function StatsScreen() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  const fromDate = `${selectedYear}-${padMonth(selectedMonth)}-01`;
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const toDate = `${selectedYear}-${padMonth(selectedMonth)}-${lastDay}`;

  const { data: transactions = [], isLoading, refetch } = useTransactions({ fromDate, toDate });

  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  function goBack() {
    let m = selectedMonth - 1;
    let y = selectedYear;
    if (m < 0) { m = 11; y -= 1; }
    const c = clamp(y, m);
    setSelectedYear(c.year);
    setSelectedMonth(c.month);
  }

  function goForward() {
    let m = selectedMonth + 1;
    let y = selectedYear;
    if (m > 11) { m = 0; y += 1; }
    const c = clamp(y, m);
    setSelectedYear(c.year);
    setSelectedMonth(c.month);
  }

  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

  const categoryMap = new Map<string, number>();
  for (const t of transactions) {
    categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
  }
  const categoryTotals: CategoryTotal[] = Array.from(categoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#22c55e" />}
      >
        <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '700', marginBottom: 20 }}>
          Stats
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#111111',
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
            marginBottom: 28,
            borderWidth: 1,
            borderColor: '#1e1e1e',
          }}
        >
          <TouchableOpacity onPress={goBack} hitSlop={12} style={{ padding: 8 }}>
            <Text style={{ color: '#22c55e', fontSize: 20 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>
            {monthLabel(selectedYear, selectedMonth)}
          </Text>
          <TouchableOpacity
            onPress={goForward}
            hitSlop={12}
            style={{ padding: 8, opacity: isCurrentMonth ? 0.3 : 1 }}
            disabled={isCurrentMonth}
          >
            <Text style={{ color: '#22c55e', fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <ActivityIndicator color="#22c55e" />
          </View>
        ) : categoryTotals.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 80 }}>
            <Text style={{ color: '#a1a1aa', fontSize: 16 }}>No data for this month</Text>
          </View>
        ) : (
          <>
            <View
              style={{
                backgroundColor: '#18181b',
                borderRadius: 16,
                padding: 20,
                marginBottom: 28,
                borderWidth: 1,
                borderColor: '#27272a',
              }}
            >
              <Text style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 6 }}>Total spent</Text>
              <Text style={{ color: '#f87171', fontSize: 36, fontWeight: '700' }}>
                ${fmt(totalSpent)}
              </Text>
            </View>

            <Text style={{ color: '#a1a1aa', fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              By category
            </Text>
            <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#27272a' }}>
              {categoryTotals.map((item, idx) => {
                const pct = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
                return (
                  <View
                    key={item.category}
                    style={{
                      backgroundColor: '#18181b',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderTopWidth: idx === 0 ? 0 : 1,
                      borderTopColor: '#27272a',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ flex: 1, color: '#ffffff', fontSize: 15, fontWeight: '500' }}>
                        {item.category}
                      </Text>
                      <Text style={{ color: '#a1a1aa', fontSize: 13, marginRight: 8 }}>
                        {pct.toFixed(0)}%
                      </Text>
                      <Text style={{ color: '#f87171', fontSize: 15, fontWeight: '600' }}>
                        ${fmt(item.total)}
                      </Text>
                    </View>
                    <View style={{ height: 4, backgroundColor: '#27272a', borderRadius: 2, overflow: 'hidden' }}>
                      <View
                        style={{
                          height: 4,
                          backgroundColor: '#f87171',
                          borderRadius: 2,
                          width: `${Math.min(100, pct)}%`,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
