/* stripe_cobros_patch.jsx — Acción rápida Stripe dentro de Cobros */
(function () {
  const OriginalCobros = window.Cobros;
  if (!OriginalCobros) return;

  function StripeQuickModal({ onClose }) {
    const [family, setFamily] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [concept, setConcept] = React.useState('Colegiatura');
    const [amount, setAmount] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    async function create() {
      if (!Number(amount) || Number(amount) <= 0) { toast('Captura un monto válido', 'warn'); return; }
      setLoading(true);
      try {
        await window.PiagetStripe.openCheckout({
          amount: Number(amount),
          currency: 'mxn',
          concept: concept || 'Pago Colegio Piaget',
          family,
          email,
          reference: 'PIAGET-' + Date.now(),
        });
      } catch (e) {
        toast(e.message || 'No se pudo abrir Stripe Checkout', 'warn');
        setLoading(false);
      }
    }

    return (
      <Modal open width={520} onClose={onClose} title="Generar link de pago Stripe"
        footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={create} disabled={loading}><Icon name="card" size={15} className="btn-ico" />{loading ? 'Creando…' : 'Abrir Checkout'}</button></>}>
        <div className="col gap-14">
          <div className="ai-panel" style={{ margin: 0 }}>
            <div className="insight" style={{ borderTop: 'none', alignItems: 'flex-start' }}>
              <div className="insight-ico" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}><Icon name="card" size={16} /></div>
              <div className="insight-body">
                <div className="insight-title">Checkout seguro de Stripe</div>
                <div className="insight-text">El pago se crea desde el backend de Vercel usando <b>STRIPE_SECRET_KEY</b>. La llave nunca se expone al navegador.</div>
              </div>
            </div>
          </div>
          <Field label="Familia / alumno"><TextInput value={family} onChange={e => setFamily(e.target.value)} placeholder="Ej. Familia Hernández" /></Field>
          <Field label="Correo del pagador"><TextInput value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@dominio.mx" /></Field>
          <Field label="Concepto"><TextInput value={concept} onChange={e => setConcept(e.target.value)} placeholder="Colegiatura, inscripción, cuota anual…" /></Field>
          <Field label="Monto MXN"><NumberInput value={amount} onChange={e => setAmount(e.target.value)} min="1" /></Field>
        </div>
      </Modal>
    );
  }

  function CobrosConStripe(props) {
    const [open, setOpen] = React.useState(false);
    return (
      <React.Fragment>
        <OriginalCobros {...props} />
        <button type="button" className="btn primary" onClick={() => setOpen(true)}
          style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 60, boxShadow: 'var(--shadow-lg)' }}>
          <Icon name="card" size={15} className="btn-ico" />Link Stripe
        </button>
        {open && <StripeQuickModal onClose={() => setOpen(false)} />}
      </React.Fragment>
    );
  }

  window.Cobros = CobrosConStripe;
})();
