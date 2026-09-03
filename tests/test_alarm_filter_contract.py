from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
ALT=(ROOT/'Fiscalizacion_BI_V27_FINAL.html').read_text(encoding='utf-8')

def test_alarm_filter_is_present_only_in_tramites_quick_filters():
    assert 'id="baseLocalAlarmFilter"' in HTML
    assert 'id="baseLocalAlarmCount"' in HTML
    assert 'ALARMAS +1 AÑO' in HTML
    assert 'id="managementAlarmFilter"' not in HTML

def test_alarm_filter_uses_existing_alarm_rule_and_composes_with_other_filters():
    assert "baseLocalFilterState={query:'',year:'',district:'',place:'',agroOnly:false,alarmOnly:false}" in HTML
    assert 'L26FilterCore.filterByAlarm(yearCases,baseLocalFilterState.alarmOnly,caseNeedsAgeAlarm)' in HTML
    assert "baseLocalFilterState.alarmOnly=!baseLocalFilterState.alarmOnly" in HTML
    assert "baseLocalFilterState.alarmOnly?' Filtro de alarmas +1 año activo.':''" in HTML

def test_alarm_filter_entrypoints_stay_identical():
    assert HTML == ALT
