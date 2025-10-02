import { describe, it, expect } from 'vitest'

describe('Basic Test Suite', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should test string operations', () => {
    const str = 'Hello World'
    expect(str.length).toBe(11)
    expect(str.toUpperCase()).toBe('HELLO WORLD')
    expect(str.toLowerCase()).toBe('hello world')
  })

  it('should test array operations', () => {
    const arr = [1, 2, 3, 4, 5]
    expect(arr.length).toBe(5)
    expect(arr.includes(3)).toBe(true)
    expect(arr.filter(n => n > 3)).toEqual([4, 5])
  })

  it('should test object operations', () => {
    const obj = { name: 'Test', value: 42, active: true }
    expect(obj.name).toBe('Test')
    expect(obj.value).toBe(42)
    expect(obj.active).toBe(true)
  })

  it('should test async operations', async () => {
    const promise = Promise.resolve('async result')
    const result = await promise
    expect(result).toBe('async result')
  })

  it('should test error handling', () => {
    expect(() => {
      throw new Error('Test error')
    }).toThrow('Test error')
  })

  it('should test null and undefined', () => {
    expect(null).toBeNull()
    expect(undefined).toBeUndefined()
    expect(null).not.toBeUndefined()
    expect(undefined).not.toBeNull()
  })

  it('should test boolean operations', () => {
    expect(true).toBeTruthy()
    expect(false).toBeFalsy()
    expect(!!'string').toBe(true)
    expect(!!'').toBe(false)
  })

  it('should test number operations', () => {
    expect(Math.max(1, 2, 3)).toBe(3)
    expect(Math.min(1, 2, 3)).toBe(1)
    expect(Math.round(3.7)).toBe(4)
    expect(Math.floor(3.7)).toBe(3)
    expect(Math.ceil(3.2)).toBe(4)
  })

  it('should test regex operations', () => {
    const regex = /^test/i
    expect(regex.test('Test')).toBe(true)
    expect(regex.test('TEST')).toBe(true)
    expect(regex.test('notest')).toBe(false)
  })
})

