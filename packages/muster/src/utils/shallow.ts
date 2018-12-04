const stubTrue = function shallow() {
  return true;
};

const shallow = { predicate: stubTrue, errorMessage: () => '' };

export default shallow;
