DO $$
DECLARE u uuid; f uuid; fac record; dep text;
BEGIN
  SELECT id INTO u FROM public.universities WHERE code = 'LAUTECH';
  IF u IS NULL THEN
    INSERT INTO public.universities (name, code, country, website, is_active, sort_order)
    VALUES ('Ladoke Akintola University of Technology', 'LAUTECH', 'Nigeria', 'https://www.lautech.edu.ng', true, 1)
    RETURNING id INTO u;
  END IF;
  FOR fac IN SELECT * FROM (VALUES
    ('Faculty of Agricultural Sciences', ARRAY['Agricultural Economics','Agricultural Extension and Rural Development','Agronomy','Animal Production and Health','Animal Nutrition and Biotechnology','Crop and Environmental Protection','Crop Production and Soil Science']),
    ('Faculty of Basic Medical Sciences', ARRAY['Anatomy','Physiology','Medical Biochemistry','Medical Laboratory Science','Nursing Science']),
    ('Faculty of Clinical Sciences', ARRAY['Medicine and Surgery']),
    ('Faculty of Computing and Informatics', ARRAY['Computer Science','Cyber Security','Information Systems','Software Engineering']),
    ('Faculty of Engineering and Technology', ARRAY['Agricultural Engineering','Biomedical Engineering','Chemical Engineering','Civil Engineering','Computer Engineering','Electronic and Electrical Engineering','Food Engineering','Mechanical Engineering','Mechatronics Engineering']),
    ('Faculty of Environmental Sciences', ARRAY['Architecture','Building','Estate Management','Fine and Applied Arts','Quantity Surveying','Surveying and Geoinformatics','Urban and Regional Planning']),
    ('Faculty of Food and Consumer Sciences', ARRAY['Food Science','Nutrition and Dietetics','Hospitality and Tourism Management']),
    ('Faculty of Management Sciences', ARRAY['Accounting','Business Administration','Economics','Marketing','Transport Management']),
    ('Faculty of Pure and Applied Sciences', ARRAY['Pure and Applied Biology','Biochemistry','Pure and Applied Chemistry','Industrial Chemistry','Earth Sciences','Pure and Applied Mathematics','Microbiology','Pure and Applied Physics','Science Laboratory Technology','Statistics']),
    ('Faculty of Renewable Natural Resources', ARRAY['Fisheries and Aquaculture','Forest Resources Management','Wildlife and Ecotourism Management'])
  ) AS t(name, deps) LOOP
    SELECT id INTO f FROM public.faculties WHERE university_id = u AND name = fac.name;
    IF f IS NULL THEN
      INSERT INTO public.faculties (university_id, name, is_active) VALUES (u, fac.name, true) RETURNING id INTO f;
    END IF;
    FOREACH dep IN ARRAY fac.deps LOOP
      IF NOT EXISTS (SELECT 1 FROM public.departments WHERE faculty_id = f AND name = dep) THEN
        INSERT INTO public.departments (faculty_id, name, is_active) VALUES (f, dep, true);
      END IF;
    END LOOP;
  END LOOP;
END $$;