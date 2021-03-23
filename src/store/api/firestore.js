import firebaseApi from "../../firebaseApi";

const getFirestoreRef = (path) => firebaseApi.firestore().collection(path);

export const fetchDocument = async (collection, id) => {
  const document = await getFirestoreRef(collection).doc(id).get();
  return !document.exists ? null : { id: document.id, ...document.data() };
};

export const fetchCollection = async (collection, options = {}) => {
  const data = [];
  let baseQuery = getFirestoreRef(collection);

  if (options.queries) {
    const { queries } = options;
    queries.forEach(({ attribute, operator, value }) => {
      baseQuery = baseQuery.where(attribute, operator, value);
    });
  }

  if (options.sort) {
    const { attribute, order } = options.sort;
    baseQuery = baseQuery.orderBy(attribute, order);
  }
  (await baseQuery.get()).forEach((doc) =>
    data.push({ id: doc.id, ...doc.data() })
  );

  return data;
};

export const deleteDocument = (collection, id) => {
  return getFirestoreRef(collection).doc(id).delete();
};

export const createDocument = async (collection, id, values) => {
  const docRef = getFirestoreRef(collection).doc(id);
  await docRef.set(values);
  const document = await docRef.get();
  return !document.exists ? null : { id: document.id, ...document.data() };
};

export const updateDocument = async (collection, id, values) => {
  const docRef = getFirestoreRef(collection).doc(id);
  await docRef.update(values);
  const document = await docRef.get();
  return !document.exists ? null : { id: document.id, ...document.data() };
};
