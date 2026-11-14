'use client'

import { useState } from 'react'
import type { Article } from '@/payload-types'

type Q = NonNullable<Article['quiz']>

export function Quiz({ questions }: { questions: Q }) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const q = questions[index]
  if (!q) return null
  const options = q.options || []
  const correct = picked !== null && !!options[picked]?.correct
  const last = index === questions.length - 1

  return (
    <section aria-labelledby="quiz-h" className="quiz">
      <span className="eyebrow">Check your understanding · {index + 1} of {questions.length}</span>
      <h2 id="quiz-h">{q.question}</h2>
      <fieldset>
        <legend className="sr-only">Choose one answer</legend>
        {options.map((o, i) => {
          const state = checked ? (o.correct ? ' is-correct' : i === picked ? ' is-wrong' : '') : i === picked ? ' is-picked' : ''
          return (
            <label key={o.id || i} className={`quiz__option${state}`}>
              <input type="radio" name={`quiz-${index}`} checked={picked === i} disabled={checked} onChange={() => setPicked(i)} />
              <span>{o.text}</span>
            </label>
          )
        })}
      </fieldset>
      {checked && (
        <p className="quiz__result" role="status">
          <strong>{correct ? 'Correct.' : 'Not quite.'}</strong> {q.explanation}
        </p>
      )}
      <div className="quiz__actions">
        {!checked ? (
          <button type="button" className="btn btn--accent btn--lg" onClick={() => picked !== null && setChecked(true)}>Check answer</button>
        ) : !last ? (
          <button type="button" className="btn btn--accent btn--lg" onClick={() => { setIndex(index + 1); setPicked(null); setChecked(false) }}>Next question</button>
        ) : (
          <button type="button" className="btn btn--outline btn--lg" onClick={() => { setIndex(0); setPicked(null); setChecked(false) }}>Start again</button>
        )}
      </div>
    </section>
  )
}
