import { useMemo, useState, type FormEvent } from 'react'
import { Calculator, ChevronRight, CircleHelp, CookingPot, Leaf, Plus, Search, Sparkles, Utensils } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Sheet } from '../components/Sheet'
import { useAuth } from '../context/AuthContext'

const mealOrder = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const

export function FoodPage() {
  const data = useData()
  const auth = useAuth()
  const [tab, setTab] = useState<'log' | 'recipes' | 'foods'>('log')
  const [recipeOpen, setRecipeOpen] = useState(false)
  const [servings, setServings] = useState(4)
  const [ingredients, setIngredients] = useState([
    { id: '1', name: 'Main ingredient', calories: 420, protein: 32 },
    { id: '2', name: 'Grain or starch', calories: 360, protein: 10 },
    { id: '3', name: 'Sauce and vegetables', calories: 220, protein: 5 },
  ])
  const totals = useMemo(() => data.meals.reduce((sum, item) => ({ calories: sum.calories + item.calories, protein: sum.protein + item.protein, carbs: sum.carbs + item.carbs, fat: sum.fat + item.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [data.meals])
  const recipeTotals = ingredients.reduce((sum, item) => ({ calories: sum.calories + item.calories, protein: sum.protein + item.protein }), { calories: 0, protein: 0 })

  const saveRecipe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRecipeOpen(false)
  }

  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">Food</p><h1>Fuel, without the fuss.</h1><p className="muted">Simple daily totals with detail when you need it.</p></div><button className="btn btn-secondary btn-icon" aria-label="Search foods"><Search size={20} /></button></header>

      <div className="tabs" role="tablist">
        <button className={`tab ${tab === 'log' ? 'active' : ''}`} onClick={() => setTab('log')} type="button">Daily log</button>
        <button className={`tab ${tab === 'recipes' ? 'active' : ''}`} onClick={() => setTab('recipes')} type="button">Recipes</button>
        <button className={`tab ${tab === 'foods' ? 'active' : ''}`} onClick={() => setTab('foods')} type="button">Saved foods</button>
      </div>

      {tab === 'log' && <>
        <section className="card food-total section">
          <div className="row-between"><div><span className="muted small">Calories today</span><div className="calorie-number">{totals.calories.toLocaleString()}</div><span className="muted small">of 2,200 kcal · {Math.max(0, 2200 - totals.calories).toLocaleString()} remaining</span></div><div style={{ width: 72, height: 72, borderRadius: '50%', display: 'grid', placeItems: 'center', background: `conic-gradient(var(--brand) ${Math.min(100, totals.calories / 22)}%, var(--line) 0)` }}><div style={{ width: 58, height: 58, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--surface)' }}><Leaf size={21} color="var(--brand)" /></div></div></div>
          <div className="macro-row" style={{ marginTop: 24 }}><Macro value={totals.protein} target={140} label="Protein" /><Macro value={totals.carbs} target={240} label="Carbs" /><Macro value={totals.fat} target={70} label="Fat" /><Macro value={22} target={30} label="Fiber" /></div>
        </section>

        <section className="section">
          <div className="section-title"><h2>Meals</h2><span className="badge badge-neutral">{data.meals.length} entries</span></div>
          <div className="card card-pad">
            {mealOrder.map((meal) => {
              const items = data.meals.filter((entry) => entry.meal === meal)
              const calories = items.reduce((sum, item) => sum + item.calories, 0)
              return <div key={meal} style={{ padding: '8px 0 14px' }}>
                <div className="row-between"><strong>{meal}</strong><span className="muted small">{calories} kcal</span></div>
                {items.length === 0 ? <button className="btn btn-ghost btn-small" type="button" style={{ marginTop: 7, paddingLeft: 0 }}><Plus size={14} /> Add {meal.toLowerCase()}</button> : items.map((entry) => <div className="meal-row" key={entry.id}><div className="row"><span className="icon-bubble" style={{ width: 36, height: 36 }}><Utensils size={16} /></span><div><strong className="small">{entry.name}</strong><div className="muted tiny">{entry.protein}g protein · {entry.source.replace('_', ' ')}</div></div></div><div className="row"><span className="small">{entry.calories}</span><ChevronRight size={15} className="muted" /></div></div>)}
              </div>
            })}
          </div>
        </section>

        <div className="insight-callout section"><strong className="small"><Sparkles size={15} style={{ display: 'inline', verticalAlign: -3, marginRight: 6 }} />7-day pattern</strong><p className="muted small" style={{ margin: '6px 0 0' }}>Your protein average is steady. Two more protein-forward meals would bring this week close to target.</p></div>
      </>}

      {tab === 'recipes' && <section className="section">
        <div className="section-title"><h2>Reusable recipes</h2><button className="btn btn-primary btn-small" type="button" onClick={() => setRecipeOpen(true)}><Plus size={15} /> New recipe</button></div>
        <div className="grid-2">{auth.isDemo && <article className="card card-pad"><span className="icon-bubble"><CookingPot size={19} /></span><h3 style={{ marginTop: 14 }}>Weekday grain bowl</h3><p className="muted small">4 servings · 425 kcal · 28g protein</p><button className="btn btn-secondary btn-small" type="button" onClick={() => data.addMeal({ name: 'Weekday grain bowl', meal: 'Lunch', calories: 425, protein: 28, carbs: 52, fat: 12, source: 'calculated' })}>Log one serving</button></article>}<button className="card card-pad empty-state" style={{ borderStyle: 'dashed', cursor: 'pointer' }} type="button" onClick={() => setRecipeOpen(true)}><Plus size={24} style={{ margin: '0 auto 8px' }} />Build a recipe from ingredients</button></div>
      </section>}

      {tab === 'foods' && <section className="section"><label style={{ position: 'relative', display: 'block' }}><Search size={18} style={{ position: 'absolute', top: 14, left: 14, color: 'var(--muted)' }} /><input className="input" style={{ paddingLeft: 43 }} placeholder="Search your foods" /></label><div className="card card-pad section"><div className="empty-state"><CircleHelp size={25} style={{ margin: '0 auto 10px' }} /><strong>Your food library grows as you log.</strong><p className="small">Create foods with known nutrition, or label an entry as estimated. Dayframe never presents an estimate as exact.</p></div></div></section>}

      <Sheet open={recipeOpen} onClose={() => setRecipeOpen(false)} title="Build a recipe" description="Nutrition recalculates as ingredients or servings change.">
        <form className="form-grid" onSubmit={saveRecipe}>
          <label className="field"><span>Recipe name</span><input className="input" placeholder="e.g. Weeknight lentil bowl" required /></label>
          <div className="row-between"><strong className="small">Ingredients</strong><button className="link-button small" type="button" onClick={() => setIngredients((items) => [...items, { id: crypto.randomUUID(), name: 'New ingredient', calories: 0, protein: 0 }])}><Plus size={14} style={{ verticalAlign: -2 }} /> Add</button></div>
          {ingredients.map((ingredient, index) => <div className="card card-quiet card-pad" key={ingredient.id} style={{ padding: 12 }}><input className="input" aria-label={`Ingredient ${index + 1} name`} value={ingredient.name} onChange={(event) => setIngredients((items) => items.map((item) => item.id === ingredient.id ? { ...item, name: event.target.value } : item))} /><div className="grid-2" style={{ marginTop: 8 }}><label className="field"><span>Calories</span><input className="input" type="number" value={ingredient.calories} onChange={(event) => setIngredients((items) => items.map((item) => item.id === ingredient.id ? { ...item, calories: Number(event.target.value) } : item))} /></label><label className="field"><span>Protein (g)</span><input className="input" type="number" value={ingredient.protein} onChange={(event) => setIngredients((items) => items.map((item) => item.id === ingredient.id ? { ...item, protein: Number(event.target.value) } : item))} /></label></div></div>)}
          <label className="field"><span>Servings</span><input className="input" type="number" min="1" value={servings} onChange={(event) => setServings(Math.max(1, Number(event.target.value)))} /></label>
          <div className="insight-callout"><div className="row"><Calculator size={18} /><strong>Per serving</strong></div><p style={{ margin: '8px 0 0' }}>{Math.round(recipeTotals.calories / servings)} kcal · {Math.round(recipeTotals.protein / servings)}g protein</p></div>
          <button className="btn btn-primary" type="submit">Save reusable recipe</button>
        </form>
      </Sheet>
    </div>
  )
}

function Macro({ value, target, label }: { value: number; target: number; label: string }) {
  return <div className="macro"><strong>{Math.round(value)}g</strong><span>{label} · {target}g</span><div className="macro-bar"><i style={{ width: `${Math.min(100, value / target * 100)}%` }} /></div></div>
}
