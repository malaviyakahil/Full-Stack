const formatNumber = (num) => {
  if (num < 1000) return num.toString();
  if (num < 1_000_000) return (num / 1000).toFixed(num >= 10_000 ? 0 : 1) + 'K';
  if (num < 1_000_000_000) return (num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1) + 'M';
  return (num / 1_000_000_000).toFixed(num >= 10_000_000_000 ? 0 : 1) + 'B';
};

export default formatNumber