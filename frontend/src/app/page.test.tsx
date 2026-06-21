import { render, screen } from '@testing-library/react'
import Home from './page'

describe('Home Page', () => {
  it('renders the Analytics Dashboard heading', () => {
    render(<Home />)

    const heading = screen.getByRole('heading', {
      name: /Analytics Dashboard/i,
    })

    expect(heading).toBeInTheDocument()
  })

  it('renders stat cards', () => {
    render(<Home />)
    expect(screen.getByText('Total Calls Today')).toBeInTheDocument()
    expect(screen.getByText('Concurrent Calls')).toBeInTheDocument()
  })
})
