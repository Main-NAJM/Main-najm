import { Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { money } from '@/lib/format';
import { SectionTitle } from '@/components/ui';

const LINKS = [
  {
    to: '/materials',
    title: 'المخزون',
    hint: 'الألمنيوم والحديد والزجاج: الكميات، حدّ التنبيه، وقيمة المخزون.',
  },
  {
    to: '/reports',
    title: 'التقرير الشهري',
    hint: 'المبيعات والتكاليف والربح والمحصّل، شهراً بشهر.',
  },
  {
    to: '/settings',
    title: 'الإعدادات',
    hint: 'بيانات المؤسسة على المستندات، العملة، والنسخ الاحتياطي.',
  },
];

export default function More() {
  const { materials, orders, profile } = useData();
  const lowStock = materials.filter(
    (material) => material.minQuantity > 0 && material.quantity <= material.minQuantity,
  ).length;
  const stockValue = materials.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  return (
    <>
      <div className="stats">
        <StatLike label="أصناف المخزون" value={String(materials.length)} />
        <StatLike label="قيمة المخزون" value={money(stockValue, profile.currency)} />
      </div>

      <SectionTitle>المزيد</SectionTitle>

      <div className="list">
        {LINKS.map((link) => (
          <Link key={link.to} className="card" to={link.to} style={{ textDecoration: 'none' }}>
            <div className="card__head">
              <div>
                <div className="card__title">{link.title}</div>
                <p className="small muted">{link.hint}</p>
              </div>
              {link.to === '/materials' && lowStock ? (
                <span className="badge badge--danger">{lowStock} تحت الحدّ</span>
              ) : null}
              {link.to === '/reports' ? (
                <span className="badge badge--muted">{orders.length} طلب</span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function StatLike({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <strong className="stat__value">{value}</strong>
    </div>
  );
}
