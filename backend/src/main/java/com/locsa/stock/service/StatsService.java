package com.locsa.stock.service;

import com.locsa.stock.dto.StatsResponse;
import com.locsa.stock.dto.StatsResponse.ChartPoint;
import com.locsa.stock.entity.StockEntry;
import com.locsa.stock.entity.StockExit;
import com.locsa.stock.repository.StockEntryRepository;
import com.locsa.stock.repository.StockExitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final StockEntryRepository entryRepository;
    private final StockExitRepository exitRepository;

    public StatsResponse getStats(String period) {
        LocalDate today = LocalDate.now();
        LocalDate from = switch (period) {
            case "week"    -> today.minusDays(6);
            case "month"   -> today.minusDays(29);
            case "3months" -> today.minusMonths(3).plusDays(1);
            case "year"    -> today.minusMonths(11).withDayOfMonth(1);
            default        -> LocalDate.of(2000, 1, 1); // all
        };

        List<StockEntry> entries = entryRepository.findByPeriod(from, today);
        List<StockExit>  exits   = exitRepository.findByPeriod(from, today);

        long entriesTotal = entries.stream().mapToLong(StockEntry::getQuantity).sum();
        long exitsTotal   = exits.stream().mapToLong(StockExit::getQuantity).sum();

        List<ChartPoint> chartData = buildChart(period, from, today, entries, exits);

        return new StatsResponse(period, entriesTotal, exitsTotal, chartData);
    }

    private List<ChartPoint> buildChart(String period, LocalDate from, LocalDate today,
                                        List<StockEntry> entries, List<StockExit> exits) {

        // key -> label, value -> {entries, exits}
        LinkedHashMap<String, long[]> map = new LinkedHashMap<>();

        if (period.equals("week") || period.equals("month")) {
            // group by day
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");
            LocalDate cursor = from;
            while (!cursor.isAfter(today)) {
                map.put(cursor.format(fmt), new long[]{0, 0});
                cursor = cursor.plusDays(1);
            }
            entries.forEach(e -> {
                String key = e.getDateEntry().format(fmt);
                if (map.containsKey(key)) map.get(key)[0] += e.getQuantity();
            });
            exits.forEach(e -> {
                String key = e.getDateExit().format(fmt);
                if (map.containsKey(key)) map.get(key)[1] += e.getQuantity();
            });

        } else if (period.equals("3months")) {
            // group by week: "Sem dd/MM"
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");
            LocalDate cursor = from;
            while (!cursor.isAfter(today)) {
                LocalDate weekStart = cursor.with(WeekFields.ISO.dayOfWeek(), 1);
                String key = "Sem " + weekStart.format(fmt);
                map.putIfAbsent(key, new long[]{0, 0});
                cursor = cursor.plusDays(1);
            }
            entries.forEach(e -> {
                LocalDate ws = e.getDateEntry().with(WeekFields.ISO.dayOfWeek(), 1);
                String key = "Sem " + ws.format(fmt);
                if (map.containsKey(key)) map.get(key)[0] += e.getQuantity();
            });
            exits.forEach(e -> {
                LocalDate ws = e.getDateExit().with(WeekFields.ISO.dayOfWeek(), 1);
                String key = "Sem " + ws.format(fmt);
                if (map.containsKey(key)) map.get(key)[1] += e.getQuantity();
            });

        } else {
            // year / all: group by month "MMM yyyy"
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy", Locale.FRENCH);
            if (period.equals("year")) {
                LocalDate cursor = from.withDayOfMonth(1);
                while (!cursor.isAfter(today)) {
                    map.put(cursor.format(fmt), new long[]{0, 0});
                    cursor = cursor.plusMonths(1);
                }
            }
            entries.forEach(e -> {
                String key = e.getDateEntry().withDayOfMonth(1).format(fmt);
                map.computeIfAbsent(key, k -> new long[]{0, 0})[0] += e.getQuantity();
            });
            exits.forEach(e -> {
                String key = e.getDateExit().withDayOfMonth(1).format(fmt);
                map.computeIfAbsent(key, k -> new long[]{0, 0})[1] += e.getQuantity();
            });
        }

        List<ChartPoint> result = new ArrayList<>();
        map.forEach((label, vals) -> result.add(new ChartPoint(label, vals[0], vals[1])));
        return result;
    }
}
