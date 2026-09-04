import robots from '../robots';

describe('robots metadata route', () => {
  it('allows crawlers to access the public application', () => {
    expect(robots()).toEqual({
      rules: {
        userAgent: '*',
        allow: '/',
      },
    });
  });
});
