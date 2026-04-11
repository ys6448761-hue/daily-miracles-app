/**
 * AdminBenefitPage.jsx — DreamTown Benefit Engine 관리자 UI
 *
 * 흐름: 인증 → 지역 선택 → 업체 목록 → 업체 상세 + 혜택 관리 → 상품 연결
 * 규칙: 삭제 ❌ / 비활성화 ✅ / city_code 필수
 */

import { useState, useEffect, useCallback } from 'react';

const API   = '/api/admin/dt';
const PAPI  = '/api/dt/products';
const ADMIN_KEY_STORE = 'dt_admin_key';

// ── 카테고리 / benefit_type 레이블 ──────────────────────────────────
const CAT_LABEL = { cafe:'카페', restaurant:'식당', night:'야간', activity:'체험', transport:'교통', accommodation:'숙소', etc:'기타' };
const CAT_EMOJI = { cafe:'☕', restaurant:'🍽️', night:'🎶', activity:'🎯', transport:'🚢', accommodation:'🏨', etc:'📌' };
const BT_LABEL  = { free:'무료', discount:'할인', gift:'증정', experience:'체험', upgrade:'업그레이드' };
const ROUTE_LABEL = { weekday:'주중 항로', starlit:'별빛 항로', family:'패밀리 항로', challenge:'도전 항로' };

// ── API 헬퍼 ─────────────────────────────────────────────────────────
function useApi(adminKey) {
  const headers = { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey };
  const call = useCallback(async (method, path, body) => {
    const r = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401) throw new Error('AUTH_FAIL');
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error ?? '요청 실패');
    return j;
  }, [adminKey]);
  return { get: p => call('GET', p), post: (p, b) => call('POST', p, b), patch: (p, b) => call('PATCH', p, b), del: p => call('DELETE', p) };
}

// ── 공통 컴포넌트 ────────────────────────────────────────────────────
function Badge({ active }) {
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20,
      background: active ? '#1a3a1a' : '#2a1a1a', color: active ? '#5fdf6a' : '#df5f5f' }}>
      {active ? '활성' : '비활성'}
    </span>
  );
}

function Btn({ onClick, children, variant = 'primary', small, disabled, style = {} }) {
  const base = { border: 'none', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
    padding: small ? '6px 14px' : '10px 20px', fontSize: small ? 13 : 14,
    fontWeight: 600, opacity: disabled ? 0.5 : 1, transition: 'opacity .15s', ...style };
  const colors = {
    primary:   { background: '#4e9fff', color: '#fff' },
    danger:    { background: '#ff4e4e', color: '#fff' },
    ghost:     { background: 'transparent', color: '#aaa', border: '1px solid #333' },
    success:   { background: '#3dba6f', color: '#fff' },
  };
  return <button style={{ ...base, ...colors[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Input({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#aaa' }}>
      {label}{required && <span style={{ color: '#ff6b6b' }}> *</span>}
      <input
        type={type} value={value ?? ''} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ background: '#1a2233', border: '1px solid #2d3a50', borderRadius: 6,
          padding: '8px 10px', color: '#eee', fontSize: 14, outline: 'none' }}
      />
    </label>
  );
}

function Select({ label, value, onChange, options, required }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#aaa' }}>
      {label}{required && <span style={{ color: '#ff6b6b' }}> *</span>}
      <select value={value ?? ''} onChange={e => onChange(e.target.value)}
        style={{ background: '#1a2233', border: '1px solid #2d3a50', borderRadius: 6,
          padding: '8px 10px', color: '#eee', fontSize: 14, outline: 'none' }}>
        <option value=''>선택...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: '#111827', border: '1px solid #1f2d40', borderRadius: 12, padding: 20, ...style }}>{children}</div>;
}

function ErrMsg({ msg }) {
  return msg ? <div style={{ color: '#ff6b6b', fontSize: 13, padding: '6px 0' }}>{msg}</div> : null;
}

// ════════════════════════════════════════════════════════════════════
// 1. 인증 화면
// ════════════════════════════════════════════════════════════════════
function AuthScreen({ onAuth }) {
  const [key, setKey] = useState('');
  const [err, setErr] = useState('');

  const submit = async () => {
    try {
      const r = await fetch(`${API}/regions`, { headers: { 'X-Admin-Key': key } });
      if (r.status === 401) { setErr('관리자 키가 올바르지 않습니다'); return; }
      localStorage.setItem(ADMIN_KEY_STORE, key);
      onAuth(key);
    } catch { setErr('서버 연결 실패'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ width: 320, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔐</div>
        <div style={{ color: '#eee', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>DreamTown 관리자</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label='관리자 키' type='password' value={key} onChange={setKey} placeholder='admin key' />
          <ErrMsg msg={err} />
          <Btn onClick={submit} disabled={!key}>입장</Btn>
        </div>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 2. 지역 선택
// ════════════════════════════════════════════════════════════════════
function RegionPanel({ api, onSelect, onAddRegion }) {
  const [regions, setRegions] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ country_code: 'KR', city_code: '', city_name: '', currency: 'KRW' });
  const [err, setErr] = useState('');

  const load = useCallback(() => api.get(`${API}/regions`).then(d => setRegions(d.regions ?? [])).catch(() => {}), [api]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      await api.post(`${API}/region`, form);
      setShowAdd(false); setForm({ country_code: 'KR', city_code: '', city_name: '', currency: 'KRW' });
      load();
    } catch(e) { setErr(e.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ color: '#eee', fontSize: 16, fontWeight: 700 }}>🌍 지역 선택</div>
        <Btn small onClick={() => setShowAdd(!showAdd)}>+ 지역 추가</Btn>
      </div>

      {showAdd && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <Input label='국가 코드' value={form.country_code} onChange={v => setForm(f => ({ ...f, country_code: v }))} placeholder='KR' required />
            <Input label='통화' value={form.currency} onChange={v => setForm(f => ({ ...f, currency: v }))} placeholder='KRW' />
            <Input label='도시 코드' value={form.city_code} onChange={v => setForm(f => ({ ...f, city_code: v }))} placeholder='busan' required />
            <Input label='도시명' value={form.city_name} onChange={v => setForm(f => ({ ...f, city_name: v }))} placeholder='부산' required />
          </div>
          <ErrMsg msg={err} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn small onClick={save}>저장</Btn>
            <Btn small variant='ghost' onClick={() => setShowAdd(false)}>취소</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {regions.map(r => (
          <button key={r.id} onClick={() => onSelect(r)}
            style={{ background: '#1a2233', border: '1px solid #2d3a50', borderRadius: 10,
              padding: '14px 16px', color: '#eee', cursor: 'pointer', textAlign: 'left',
              transition: 'border-color .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='#4e9fff'}
            onMouseLeave={e => e.currentTarget.style.borderColor='#2d3a50'}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{r.country_code === 'KR' ? '🇰🇷' : r.country_code === 'JP' ? '🇯🇵' : '🌐'}</div>
            <div style={{ fontWeight: 700 }}>{r.city_name}</div>
            <div style={{ fontSize: 11, color: '#556' }}>{r.city_code} · {r.currency}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 3. 업체 목록 + 추가 폼
// ════════════════════════════════════════════════════════════════════
function PartnerList({ api, cityCode, onSelect }) {
  const [partners, setPartners] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', address: '', lat: '', lng: '', phone: '', description: '' });
  const [err, setErr] = useState('');

  const load = useCallback(() =>
    api.get(`${API}/partners?city_code=${cityCode}`).then(d => setPartners(d.partners ?? [])).catch(() => {}),
    [api, cityCode]);
  useEffect(() => { load(); }, [load]);

  const f = k => v => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setErr('');
    try {
      await api.post(`${API}/partner`, { ...form, city_code: cityCode, lat: form.lat || null, lng: form.lng || null });
      setShowAdd(false); setForm({ name: '', category: '', address: '', lat: '', lng: '', phone: '', description: '' });
      load();
    } catch(e) { setErr(e.message); }
  };

  const catOpts = Object.entries(CAT_LABEL).map(([v, l]) => ({ value: v, label: `${CAT_EMOJI[v]} ${l}` }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ color: '#eee', fontSize: 16, fontWeight: 700 }}>업체 목록</div>
        <Btn small onClick={() => setShowAdd(!showAdd)}>+ 업체 추가</Btn>
      </div>

      {showAdd && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ color: '#aaa', fontSize: 13, marginBottom: 12 }}>새 업체 등록</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <Input label='업체명' value={form.name} onChange={f('name')} required />
            <Select label='카테고리' value={form.category} onChange={f('category')} options={catOpts} required />
            <Input label='주소' value={form.address} onChange={f('address')} />
            <Input label='전화' value={form.phone} onChange={f('phone')} placeholder='010-...' />
            <Input label='위도' value={form.lat} onChange={f('lat')} placeholder='34.7018' type='number' />
            <Input label='경도' value={form.lng} onChange={f('lng')} placeholder='127.7456' type='number' />
          </div>
          <div style={{ marginBottom: 10 }}>
            <Input label='업체 설명' value={form.description} onChange={f('description')} placeholder='간략 설명' />
          </div>
          <ErrMsg msg={err} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn small onClick={save} disabled={!form.name || !form.category}>저장</Btn>
            <Btn small variant='ghost' onClick={() => setShowAdd(false)}>취소</Btn>
          </div>
        </Card>
      )}

      {!partners.length && <div style={{ color: '#556', fontSize: 14, textAlign: 'center', padding: 32 }}>등록된 업체가 없습니다</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {partners.map(p => (
          <button key={p.id} onClick={() => onSelect(p)}
            style={{ background: '#1a2233', border: '1px solid #2d3a50', borderRadius: 10,
              padding: '12px 16px', color: '#eee', cursor: 'pointer', textAlign: 'left',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='#4e9fff'}
            onMouseLeave={e => e.currentTarget.style.borderColor='#2d3a50'}>
            <div>
              <span style={{ marginRight: 8 }}>{CAT_EMOJI[p.category]}</span>
              <span style={{ fontWeight: 600 }}>{p.name}</span>
              <span style={{ fontSize: 12, color: '#556', marginLeft: 8 }}>{CAT_LABEL[p.category]}</span>
            </div>
            <Badge active={p.is_active} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 4. 업체 상세 + 혜택 관리
// ════════════════════════════════════════════════════════════════════
function PartnerDetail({ api, partner: initPartner, onBack }) {
  const [partner, setPartner] = useState(initPartner);
  const [benefits, setBenefits] = useState([]);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: initPartner.name, category: initPartner.category, address: initPartner.address ?? '', phone: initPartner.phone ?? '', description: initPartner.description ?? '' });
  const [benefitForm, setBenefitForm] = useState({ benefit_type: '', title: '', description: '', display_copy: '', location_hint: '' });
  const [showAddBenefit, setShowAddBenefit] = useState(false);
  const [err, setErr] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  const f = k => v => setForm(p => ({ ...p, [k]: v }));
  const bf = k => v => setBenefitForm(p => ({ ...p, [k]: v }));

  const loadBenefits = useCallback(() =>
    api.get(`${API}/benefits?partner_id=${partner.id}`).then(d => setBenefits(d.benefits ?? [])).catch(() => {}),
    [api, partner.id]);
  const loadProducts = useCallback(() =>
    api.get(`${PAPI}?city_code=${partner.city_code}`).then(d => setProducts(d.products ?? [])).catch(() => {}),
    [api, partner.city_code]);

  useEffect(() => { loadBenefits(); loadProducts(); }, [loadBenefits, loadProducts]);

  const savePartner = async () => {
    setErr(''); setSaveMsg('');
    try {
      const d = await api.patch(`${API}/partner/${partner.id}`, form);
      setPartner(d.partner); setEditing(false); setSaveMsg('저장됨 ✓');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch(e) { setErr(e.message); }
  };

  const togglePartner = async () => {
    try {
      const d = await api.patch(`${API}/partner/${partner.id}`, { is_active: !partner.is_active });
      setPartner(d.partner);
    } catch(e) { setErr(e.message); }
  };

  const toggleBenefit = async (b) => {
    try {
      await api.patch(`${API}/benefit/${b.id}`, { is_active: !b.is_active });
      loadBenefits();
    } catch(e) { setErr(e.message); }
  };

  const addBenefit = async () => {
    setErr('');
    try {
      await api.post(`${API}/benefit`, { ...benefitForm, partner_id: partner.id });
      setShowAddBenefit(false);
      setBenefitForm({ benefit_type: '', title: '', description: '', display_copy: '', location_hint: '' });
      loadBenefits();
    } catch(e) { setErr(e.message); }
  };

  const toggleProductLink = async (benefit, product, isLinked, linkId) => {
    try {
      if (isLinked) {
        await api.del(`${API}/product-benefit/${linkId}`);
      } else {
        await api.post(`${API}/product-benefit`, { product_id: product.id, benefit_id: benefit.id });
      }
      loadBenefits();
    } catch(e) { setErr(e.message); }
  };

  const btOpts = Object.entries(BT_LABEL).map(([v, l]) => ({ value: v, label: l }));
  const catOpts = Object.entries(CAT_LABEL).map(([v, l]) => ({ value: v, label: `${CAT_EMOJI[v]} ${l}` }));

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#4e9fff', cursor: 'pointer', fontSize: 22 }}>←</button>
        <div>
          <div style={{ color: '#eee', fontSize: 17, fontWeight: 700 }}>
            {CAT_EMOJI[partner.category]} {partner.name}
          </div>
          <div style={{ fontSize: 12, color: '#556' }}>{partner.city_code} · {CAT_LABEL[partner.category]}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge active={partner.is_active} />
          <Btn small variant={partner.is_active ? 'danger' : 'success'} onClick={togglePartner}>
            {partner.is_active ? '비활성화' : '활성화'}
          </Btn>
        </div>
      </div>

      {/* 업체 정보 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ color: '#aaa', fontSize: 13 }}>업체 정보</div>
          <button onClick={() => setEditing(!editing)} style={{ background: 'none', border: 'none', color: '#4e9fff', cursor: 'pointer', fontSize: 13 }}>
            {editing ? '취소' : '수정'}
          </button>
        </div>
        {editing ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <Input label='업체명' value={form.name} onChange={f('name')} required />
              <Select label='카테고리' value={form.category} onChange={f('category')} options={catOpts} />
              <Input label='주소' value={form.address} onChange={f('address')} />
              <Input label='전화' value={form.phone} onChange={f('phone')} />
            </div>
            <Input label='설명' value={form.description} onChange={f('description')} />
            <ErrMsg msg={err} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Btn small onClick={savePartner}>저장</Btn>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#ccc', lineHeight: 1.8 }}>
            {partner.address && <div>📍 {partner.address}</div>}
            {partner.phone && <div>📞 {partner.phone}</div>}
            {partner.description && <div style={{ color: '#888' }}>{partner.description}</div>}
            {saveMsg && <div style={{ color: '#5fdf6a', fontSize: 13 }}>{saveMsg}</div>}
          </div>
        )}
      </Card>

      {/* 혜택 목록 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: '#eee', fontSize: 15, fontWeight: 700 }}>혜택 관리</div>
        <Btn small onClick={() => setShowAddBenefit(!showAddBenefit)}>+ 혜택 추가</Btn>
      </div>

      {showAddBenefit && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ color: '#aaa', fontSize: 13, marginBottom: 12 }}>새 혜택</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <Select label='혜택 타입' value={benefitForm.benefit_type} onChange={bf('benefit_type')} options={btOpts} required />
            <Input label='혜택명 (관리용)' value={benefitForm.title} onChange={bf('title')} placeholder='아메리카노 1잔 무료' required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
            <Input label='조건 상세' value={benefitForm.description} onChange={bf('description')} placeholder='케이블카 이용권 소지자에 한함' />
            <Input label='노출 문장 (UX 카피)' value={benefitForm.display_copy} onChange={bf('display_copy')} placeholder='잠깐 쉬어갈 수 있어요 ☕' required />
            <Input label='위치 힌트' value={benefitForm.location_hint} onChange={bf('location_hint')} placeholder='해상케이블카 하차장 도보 3분' />
          </div>
          <ErrMsg msg={err} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn small onClick={addBenefit} disabled={!benefitForm.benefit_type || !benefitForm.title || !benefitForm.display_copy}>저장</Btn>
            <Btn small variant='ghost' onClick={() => setShowAddBenefit(false)}>취소</Btn>
          </div>
        </Card>
      )}

      {!benefits.length && (
        <div style={{ color: '#556', fontSize: 14, textAlign: 'center', padding: 24 }}>등록된 혜택이 없습니다</div>
      )}

      {benefits.map(b => (
        <BenefitCard key={b.id} benefit={b} products={products}
          onToggle={() => toggleBenefit(b)}
          onLinkToggle={toggleProductLink}
          api={api}
        />
      ))}
    </div>
  );
}

// ── 혜택 카드 + 상품 연결 패널 ─────────────────────────────────────
function BenefitCard({ benefit: b, products, onToggle }) {
  const [open, setOpen] = useState(false);

  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, background: '#1a2f4a', color: '#4e9fff', padding: '2px 8px', borderRadius: 20 }}>
              {BT_LABEL[b.benefit_type] ?? b.benefit_type}
            </span>
            <Badge active={b.is_active} />
          </div>
          <div style={{ color: '#eee', fontWeight: 600, fontSize: 14 }}>{b.title}</div>
          <div style={{ color: '#5fdf9a', fontSize: 13, marginTop: 4 }}>"{b.display_copy}"</div>
          {b.location_hint && <div style={{ color: '#556', fontSize: 12, marginTop: 2 }}>📍 {b.location_hint}</div>}
          {b.description && <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{b.description}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 12 }}>
          <Btn small variant={b.is_active ? 'danger' : 'success'} onClick={onToggle}>
            {b.is_active ? '비활성화' : '활성화'}
          </Btn>
          <Btn small variant='ghost' onClick={() => setOpen(!open)}>
            {open ? '연결 닫기' : '상품 연결'}
          </Btn>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 14, borderTop: '1px solid #1f2d40', paddingTop: 14 }}>
          <div style={{ color: '#aaa', fontSize: 13, marginBottom: 10 }}>이 혜택을 어떤 상품에 붙일까요?</div>
          <ProductLinkPanel benefitId={b.id} products={products} />
        </div>
      )}
    </Card>
  );
}

// ── 상품 연결 패널 ───────────────────────────────────────────────────
function ProductLinkPanel({ benefitId, products }) {
  const adminKey = localStorage.getItem(ADMIN_KEY_STORE);
  const [linkMap, setLinkMap] = useState({});  // product_id → linkId | null
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const results = {};
    await Promise.all(
      products.map(async p => {
        const r = await fetch(`${PAPI}/${p.product_code}`).then(x => x.json()).catch(() => ({ benefits: [] }));
        const match = r.benefits?.find(b => b.id === benefitId);
        results[p.id] = match ? match.id : null; // linkId는 없으므로 benefit.id 재사용
      })
    );
    setLinkMap(results);
  }, [benefitId, products]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (product) => {
    setLoading(true);
    const isLinked = !!linkMap[product.id];
    try {
      if (isLinked) {
        // 연결 해제: product-benefit link ID 조회
        const adminData = await fetch(`${API}/products?city_code=${product.city_code}`, {
          headers: { 'X-Admin-Key': adminKey }
        }).then(r => r.json());
        // link_id 직접 조회 (admin API에서 product_benefits JOIN 필요)
        // 현재는 product benefit 재연결로 upsert 처리
        // TODO: admin GET endpoint 추가 후 DELETE 지원
        alert('연결 해제는 관리자 API에서 link_id 조회 후 가능합니다. (구현 예정)');
      } else {
        await fetch(`${API}/product-benefit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
          body: JSON.stringify({ product_id: product.id, benefit_id: benefitId })
        });
        load();
      }
    } catch(e) { alert(e.message); }
    setLoading(false);
  };

  const grouped = {};
  for (const p of products) {
    if (!grouped[p.route_type]) grouped[p.route_type] = [];
    grouped[p.route_type].push(p);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Object.entries(grouped).map(([route, prods]) => (
        <div key={route}>
          <div style={{ color: '#556', fontSize: 11, marginBottom: 4 }}>{ROUTE_LABEL[route] ?? route}</div>
          {prods.map(p => {
            const linked = !!linkMap[p.id];
            return (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                cursor: 'pointer', borderBottom: '1px solid #1f2d40' }}>
                <input type='checkbox' checked={linked} onChange={() => toggle(p)} disabled={loading}
                  style={{ accentColor: '#4e9fff', width: 16, height: 16 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#ddd', fontSize: 13 }}>{p.title}</div>
                  <div style={{ color: '#556', fontSize: 11 }}>₩{p.price?.toLocaleString()}</div>
                </div>
                {p.tag && <span style={{ fontSize: 11, background: '#2a1f3a', color: '#b080ff', padding: '2px 6px', borderRadius: 10 }}>{p.tag}</span>}
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 메인 — AdminBenefitPage
// ════════════════════════════════════════════════════════════════════
export default function AdminBenefitPage() {
  const savedKey = localStorage.getItem(ADMIN_KEY_STORE);
  const [adminKey, setAdminKey] = useState(savedKey ?? '');
  const [authed, setAuthed] = useState(false);
  const [region, setRegion] = useState(null);
  const [partner, setPartner] = useState(null);
  const api = useApi(adminKey);

  // 저장된 키로 자동 인증 시도
  useEffect(() => {
    if (savedKey) {
      fetch(`${API}/regions`, { headers: { 'X-Admin-Key': savedKey } })
        .then(r => { if (r.ok) { setAdminKey(savedKey); setAuthed(true); } })
        .catch(() => {});
    }
  }, []);

  const logout = () => {
    localStorage.removeItem(ADMIN_KEY_STORE);
    setAuthed(false); setRegion(null); setPartner(null);
  };

  if (!authed) return <AuthScreen onAuth={k => { setAdminKey(k); setAuthed(true); }} />;

  // 브레드크럼
  const crumbs = ['지역', region?.city_name, partner?.name].filter(Boolean);

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', color: '#eee', fontFamily: 'system-ui, sans-serif' }}>
      {/* 상단 헤더 */}
      <div style={{ background: '#0d1f35', borderBottom: '1px solid #1f2d40', padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🌟</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>DreamTown 관리자</span>
          {crumbs.length > 0 && (
            <div style={{ fontSize: 12, color: '#4e9fff', marginLeft: 8 }}>
              {crumbs.map((c, i) => (
                <span key={i}>
                  {i > 0 && <span style={{ color: '#333' }}> › </span>}
                  <span style={{ cursor: i < crumbs.length - 1 ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (i === 0) { setRegion(null); setPartner(null); }
                      if (i === 1) { setPartner(null); }
                    }}>{c}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: '#556', cursor: 'pointer', fontSize: 12 }}>로그아웃</button>
      </div>

      {/* 콘텐츠 */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 20px' }}>
        {!region && <RegionPanel api={api} onSelect={r => { setRegion(r); setPartner(null); }} />}
        {region && !partner && (
          <PartnerList api={api} cityCode={region.city_code} onSelect={setPartner} />
        )}
        {region && partner && (
          <PartnerDetail api={api} partner={partner} onBack={() => setPartner(null)} />
        )}
      </div>
    </div>
  );
}
